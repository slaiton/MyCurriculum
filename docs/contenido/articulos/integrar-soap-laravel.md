---
title: Integrar un servicio SOAP heredado desde Laravel sin contaminar tu código
slug: integrar-soap-laravel
excerpt: Cómo consumir un servicio SOAP antiguo desde Laravel aislándolo detrás de una interfaz: timeouts, errores, mapeo a objetos propios y pruebas sin llamar al proveedor.
category: arquitectura
tags: [laravel, soap, integraciones, php]
featured: true
metaTitle: Integrar SOAP en Laravel sin contaminar tu código
metaDescription: Consume un servicio SOAP heredado desde Laravel con una interfaz propia, timeouts, manejo de errores y pruebas sin llamar al proveedor.
---

Muchos sistemas con los que tenemos que hablar todavía exponen servicios SOAP: transportadoras, aseguradoras, entidades del gobierno o ERPs de hace quince años. El problema no es SOAP en sí, sino lo que pasa cuando el XML, los nombres raros del proveedor y sus errores se filtran por toda tu aplicación. En este artículo vamos a aislar esa integración detrás de una interfaz propia, para que el resto del código de Laravel ni se entere de que existe un servicio SOAP.

## El problema: el proveedor manda en tu código

La forma rápida de integrar un servicio SOAP es instanciar `SoapClient` en el controlador, llamar al método y recorrer la respuesta. Funciona el primer día. Después aparecen los síntomas:

- Nombres del proveedor como `GetGuiaResult->DatosEnvio->CodEstado` regados en controladores, vistas y jobs.
- Imposible probar sin conexión al proveedor (o sin su ambiente de pruebas, que casi nunca funciona).
- Un cambio del proveedor obliga a tocar decenas de archivos.
- Errores de red que tumban una petición completa porque nadie definió un timeout.

## La idea: una interfaz que habla tu idioma

La solución es un adaptador. Defines una interfaz con los conceptos de tu negocio (un envío, un estado de seguimiento) y una implementación que es la única que sabe de SOAP. Es el mismo principio de la arquitectura hexagonal: el dominio define el puerto, la infraestructura lo implementa.

### 1. Un objeto propio para la respuesta

```php
<?php

namespace App\Shipping;

final class TrackingStatus
{
    public function __construct(
        public readonly string $trackingCode,
        public readonly string $status,
        public readonly ?\DateTimeImmutable $updatedAt,
    ) {}
}
```

### 2. La interfaz (el puerto)

```php
<?php

namespace App\Shipping;

interface CarrierGateway
{
    /** @throws CarrierUnavailable cuando el proveedor no responde */
    public function trackingStatus(string $trackingCode): TrackingStatus;
}
```

```php
<?php

namespace App\Shipping;

final class CarrierUnavailable extends \RuntimeException {}
```

### 3. La implementación SOAP (el adaptador)

Aquí, y solo aquí, vive todo lo que sabe de SOAP: la URL del WSDL, las opciones del cliente, los nombres del proveedor y la traducción de sus errores.

```php
<?php

namespace App\Shipping\Soap;

use App\Shipping\CarrierGateway;
use App\Shipping\CarrierUnavailable;
use App\Shipping\TrackingStatus;
use SoapClient;
use SoapFault;

final class SoapCarrierGateway implements CarrierGateway
{
    private ?SoapClient $client = null;

    public function __construct(
        private readonly string $wsdl,
        private readonly int $timeoutSeconds = 10,
    ) {}

    public function trackingStatus(string $trackingCode): TrackingStatus
    {
        try {
            $response = $this->client()->ConsultarGuia(['numeroGuia' => $trackingCode]);
        } catch (SoapFault $e) {
            throw new CarrierUnavailable('El proveedor no respondió: ' . $e->getMessage(), previous: $e);
        }

        $data = $response->ConsultarGuiaResult ?? null;

        return new TrackingStatus(
            trackingCode: $trackingCode,
            status: $this->mapStatus((string) ($data->CodEstado ?? '')),
            updatedAt: isset($data->FechaEstado) ? new \DateTimeImmutable($data->FechaEstado) : null,
        );
    }

    private function client(): SoapClient
    {
        // Límite para la respuesta (SoapClient lo toma de esta directiva)
        ini_set('default_socket_timeout', (string) $this->timeoutSeconds);

        return $this->client ??= new SoapClient($this->wsdl, [
            'exceptions' => true,
            'connection_timeout' => $this->timeoutSeconds, // límite para conectar
            'cache_wsdl' => WSDL_CACHE_MEMORY,
            'trace' => false,
        ]);
    }

    private function mapStatus(string $code): string
    {
        return match ($code) {
            '01' => 'recibido',
            '02' => 'en_transito',
            '03' => 'entregado',
            default => 'desconocido',
        };
    }
}
```

Fíjate en tres decisiones:

- **Dos límites de tiempo distintos:** `connection_timeout` controla cuánto esperar para conectar y `default_socket_timeout` cuánto esperar la respuesta. Sin ellos, un proveedor lento puede dejar tu proceso colgado.
- **El cliente se crea solo cuando se usa** (`??=`). Así el WSDL no se descarga en peticiones que nunca llaman al proveedor.
- **Los códigos del proveedor se traducen** a estados tuyos. Si el proveedor cambia sus códigos, cambias un `match` y nada más.

### 4. Conectar la interfaz en Laravel

En un service provider le dices a Laravel qué implementación usar cuando alguien pida la interfaz:

```php
<?php

namespace App\Providers;

use App\Shipping\CarrierGateway;
use App\Shipping\Soap\SoapCarrierGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(CarrierGateway::class, fn () => new SoapCarrierGateway(
            wsdl: config('services.carrier.wsdl'),
            timeoutSeconds: (int) config('services.carrier.timeout', 10),
        ));
    }
}
```

Y en `config/services.php`:

```php
'carrier' => [
    'wsdl' => env('CARRIER_WSDL'),
    'timeout' => env('CARRIER_TIMEOUT', 10),
],
```

### 5. Usarla sin saber que existe SOAP

```php
<?php

namespace App\Http\Controllers;

use App\Shipping\CarrierGateway;
use App\Shipping\CarrierUnavailable;

class TrackingController
{
    public function show(string $code, CarrierGateway $carrier)
    {
        try {
            $status = $carrier->trackingStatus($code);
        } catch (CarrierUnavailable) {
            return response()->json(['message' => 'El seguimiento no está disponible en este momento.'], 503);
        }

        return response()->json([
            'codigo' => $status->trackingCode,
            'estado' => $status->status,
            'actualizado' => $status->updatedAt?->format(DATE_ATOM),
        ]);
    }
}
```

## Probar sin llamar al proveedor

El gran beneficio aparece en las pruebas. Como el controlador depende de la interfaz, puedes reemplazarla por una versión falsa:

```php
<?php

use App\Shipping\CarrierGateway;
use App\Shipping\CarrierUnavailable;
use App\Shipping\TrackingStatus;

it('muestra el estado de una guía', function () {
    $this->app->instance(CarrierGateway::class, new class implements CarrierGateway {
        public function trackingStatus(string $code): TrackingStatus
        {
            return new TrackingStatus($code, 'entregado', new DateTimeImmutable('2026-10-01T10:00:00Z'));
        }
    });

    $this->getJson('/api/tracking/ABC123')
        ->assertOk()
        ->assertJson(['estado' => 'entregado']);
});

it('responde 503 si el proveedor no está disponible', function () {
    $this->app->instance(CarrierGateway::class, new class implements CarrierGateway {
        public function trackingStatus(string $code): TrackingStatus
        {
            throw new CarrierUnavailable('timeout');
        }
    });

    $this->getJson('/api/tracking/ABC123')->assertStatus(503);
});
```

Estas pruebas corren en milisegundos y no dependen de que el ambiente de pruebas del proveedor esté arriba.

## Cuándo no hace falta tanto

Si la integración es un único llamado en un script que se ejecuta una vez al mes, una interfaz y un adaptador pueden ser exagerados. El patrón paga su costo cuando:

- La respuesta del proveedor se usa en varios lugares de la aplicación.
- Necesitas pruebas automatizadas confiables.
- Existe la posibilidad real de cambiar de proveedor o de tener varios (por ejemplo, varias transportadoras con la misma interfaz).

## Resumen

- Define una interfaz con conceptos de tu negocio, no del proveedor.
- Encierra SOAP en una sola clase: WSDL, opciones, nombres y errores.
- Pon siempre límites de conexión y de respuesta.
- Traduce los errores del proveedor a excepciones tuyas.
- Prueba con implementaciones falsas, no contra el proveedor.

¿Tienes una integración heredada que te está complicando la vida? Escríbeme y lo conversamos.
