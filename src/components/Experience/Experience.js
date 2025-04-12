import React, { useEffect, useState } from 'react';
import './Experience.css';
import { motion } from 'framer-motion';
import useScroll from '../../hooks/useScrollDetection';
import { useSpring, animated } from "@react-spring/web";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function Experience({ onNavigate }) {
    const [isVisible, setIsVisible] = React.useState(true);
    const rowsPerPage = 4;
    const [currentPage, setCurrentPage] = useState(1);

    const data = [
        {
          jobTitle: 'Analista de software',
          company: 'Aldia Logistica',
          dateStart: '2020-03-20',
          dateEnd: 'Actualmente',
          description:
            "Responsable del ciclo completo de desarrollo como Full Stack Developer. He liderado y ejecutado proyectos en tecnologías como Kotlin, Laravel, Angular, React, Express, PHP y JavaScript nativo. Despliegues realizados en entornos AWS y Docker. Gestión de bases de datos SQL y PostgreSQL. Implementación de arquitecturas Hexagonales y Clean Architecture. Integración de servicios REST y SOAP con clientes y proveedores. Desarrollo de aplicaciones Android y mantenimiento de soluciones web."
        },
        {
          jobTitle: 'Desarrollador Freelance',
          company: '',
          dateStart: '2019-01-20',
          dateEnd: 'Actualmente',
          description:
            "Desarrollo de soluciones a medida para clientes independientes, aplicando conocimientos Full Stack en Laravel, Angular, Kotlin, entre otros. Diseño y despliegue de APIs, integración de servicios web, administración de servidores y soporte general. Trabajo enfocado en entregas rápidas, eficientes y adaptadas a las necesidades del cliente."
        },
        {
          jobTitle: 'Gestor de desarrollo',
          company: 'Aldia Logistica',
          dateStart: '2018-02-18',
          dateEnd: '2020-03-20',
          description:
            "Participación activa en la creación e integración de APIs para procesos logísticos. Desarrollo y administración de una página web corporativa en WordPress. Implementación de soluciones puntuales con Laravel. Gestión de objetivos técnicos del equipo y definición de estrategias para proyectos internos."
        },
        {
          jobTitle: 'Auxiliar de sistemas',
          company: 'Konecta',
          dateStart: '2018-09-20',
          dateEnd: '2019-02-01',
          description:
            "Soporte de primer nivel a usuarios finales, mantenimiento preventivo y correctivo de equipos de cómputo. Diagnóstico y solución de problemas técnicos básicos en hardware y software."
        }
      ];


    const totalPages = Math.ceil(data.length / rowsPerPage);
    const currentData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrev = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const [canNavigate, setCanNavigate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setCanNavigate(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);


    const handleScroll = (event) => {
        if (!canNavigate) return;
        if (event.deltaY > 0) {
            onNavigate("#skills");
        } else if (event.deltaY < 0) {
            onNavigate("#aboutMe");
        }
    };

    useScroll(handleScroll);

    return (
        <motion.section
            initial={{ y: '-100vh', opacity: 0 }}
            animate={{ y: isVisible ? '0' : '-100vh', opacity: isVisible ? 1 : 0 }}
            exit={{ y: '-100vh', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            id="experience" className="experience">
            <div className='container'>
                <div className="table-container">
                    <table className="experience-table">
                        <thead>
                            <tr>
                                <th><h1>Experiencia</h1></th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((row, index) => (
                                <tr key={index} className="table-row">
                                    <td>{row.dateStart} - {row.dateEnd}</td>
                                    <td>{row.jobTitle}</td>
                                    <td>{row.company}</td>
                                    <td className='colorGray'>{row.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button onClick={handlePrev} disabled={currentPage === 1}>
                                Prev
                            </button>
                            <span>{`Page ${currentPage} of ${totalPages}`}</span>
                            <button onClick={handleNext} disabled={currentPage === totalPages}>
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </motion.section>
    );
}

export default Experience;