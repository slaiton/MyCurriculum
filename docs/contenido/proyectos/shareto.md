# Proyecto ShareTo: campos para el panel

Panel → *Content Manager* → **Proyecto** → *Create new entry*.

| Campo | Valor |
|---|---|
| **title** | ShareTo |
| **slug** | shareto |
| **summary** | Un solo teclado y un solo mouse para todos tus PCs con Windows. Pasa de un equipo a otro con solo mover el puntero, y copia y pega texto, imágenes y archivos entre ellos. |
| **url** | *(vacío)* |
| **repoUrl** | *(vacío, salvo que publiques el código)* |
| **version** | 0.2.0 |
| **requirements** | Windows 10 (versión 2004) o posterior; recomendado Windows 11. Bluetooth en cada equipo o todos en la misma red. Instala ShareTo en cada PC. |
| **stack** | `["C#", ".NET 10", "WinUI 3", "Bluetooth RFCOMM", "TLS 1.3"]` |
| **targetKeywords** | keyboard and mouse sharing software, conectar mouse, compartir mouse y teclado, conectar dispositivos, compartir teclado y mouse entre pc, un teclado y mouse para dos computadoras, alternativa a mouse without borders |
| **color** | blue |
| **order** | 0 (para que salga primero) |
| **cover** | Captura de la pantalla *Diseño de pantallas*, con texto alternativo: "ShareTo mostrando dos PCs organizados uno al lado del otro" |
| **seo → metaTitle** | ShareTo: un teclado y un mouse para varios PCs |
| **seo → metaDescription** | Controla varios PCs con Windows con un solo teclado y mouse, por Bluetooth o red local. Copia y pega archivos entre equipos. Descarga gratis. |

## downloads (componente repetible *Descarga*)

Los enlaces son fijos: al sacar una versión nueva solo reemplazas los archivos en `descargas/shareto/`, actualizas
`SHA256SUMS.txt`, el campo **version** y las huellas/tamaños de aquí. Los enlaces no cambian.

| label | platform | url | sizeMb | sha256 |
|---|---|---|---|---|
| Descargar para Windows (x64) | windows-x64 | https://cms.slaiton.com/descargas/shareto/ShareTo-win-x64-instalador.exe | 43.5 | bd3088d549cf2e93c2833d19fc678b09d608c85eb1a677a135f60d0344db9cdc |
| Descargar para Windows (ARM64) | windows-arm64 | https://cms.slaiton.com/descargas/shareto/ShareTo-win-arm64-instalador.exe | 41.2 | f55d71fc300d33d3359b534659eec859ee6fb46d473d0130cf4b81603e43a647 |

## body → sección **Markdown** (pega desde aquí hasta el final)

---

¿Trabajas con un portátil y un PC de escritorio al mismo tiempo? Con ShareTo los usas **como si fueran un solo equipo**: lleva el puntero al borde de la pantalla y el mouse y el teclado pasan al otro PC. Sin cables extra, sin cambiar de teclado y sin conmutadores KVM.

## Lo que puedes hacer

- **Un teclado y un mouse para todo.** Organiza tus pantallas como están en tu escritorio y cruza de un PC a otro moviendo el puntero.
- **Copiar aquí, pegar allá.** Texto, imágenes, contenido con formato y hasta **archivos y carpetas**: los copias en un equipo y los pegas con Ctrl+V en el otro.
- **Por Bluetooth o por tu red.** Si los equipos están en la misma red, ShareTo la usa automáticamente; si no, se conecta por Bluetooth. Se reconecta solo si la conexión se cae.
- **Se siente nativo.** El cursor responde sin retrasos perceptibles, incluso con mouse de alta frecuencia, y las teclas funcionan con cualquier distribución de teclado.
- **Siempre a mano.** Vive en la bandeja del sistema y muestra la calidad de la conexión de cada equipo.

## Privado y seguro

Todo viaja **cifrado de extremo a extremo** (TLS 1.3) directamente entre tus equipos: no hay servidores intermedios ni cuentas que crear. La primera vez que conectas dos PCs, ambos muestran un **código de 6 dígitos** para que confirmes que son los tuyos.

## Cómo empezar

1. Descarga e instala ShareTo en **cada** PC (elige x64 o ARM64 según tu equipo).
2. Abre ShareTo en el equipo que tiene el teclado y el mouse, y busca el otro PC en **Dispositivos**.
3. Confirma el código de 6 dígitos en ambos equipos.
4. En **Diseño de pantallas**, arrastra los monitores a su posición real. ¡Listo!

> Al ser una versión temprana, Windows puede mostrar el aviso de SmartScreen la primera vez. Elige **Más información → Ejecutar de todas formas**. Puedes verificar el archivo con la huella SHA-256 que aparece arriba.

## Detrás de escena

ShareTo está construido en C# con .NET 10 y WinUI 3. Usa un protocolo binario propio optimizado para que un movimiento de mouse ocupe apenas 13 bytes, con control de flujo para que el cursor nunca acumule atraso: en un enlace Bluetooth lento el retraso máximo pasa de casi un segundo a unos 25 ms. Las teclas y los clics nunca se pierden.

¿Tienes ideas o encontraste un error? Escríbeme: ShareTo sigue creciendo.
