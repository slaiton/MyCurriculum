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
        { jobTitle: 'Analista de software', company: 'Aldia Logistica', dateStart: '2020-03-20', dateEnd: 'Actualmente', description: "Desarrollo y mantenimiento de software en PHP, javascript y lenguajes relacionados, Manejo de servidor de base de datos. creación de consultas y procesos almacenados. desarrollador y administrador de página web corporativa, Lider en Integraciones tecnológicas con nuevos clientes y proveedores en Servicios Web Rest y Soap. Desarrollo de aplicaciones Android en Kotlin y Angular" },
        { jobTitle: 'Front-End Developer', company: 'Aldia Logistica', dateStart: '2018-02-18', dateEnd: '2020-03-20', description: "Mantenimientos correctivos y preventivos de equipos de cómputo, soporte al usuario, Participación en desarrollo de software de logística, establecer objetivos y metas, así como directrices, estrategias y cursos de acción para la implementación y ejecución del proyecto. Desarrollo web y manejo se servicios web" },
        { jobTitle: 'Back-End Developer', company: 'Konecta', dateStart: '2018-09-20', dateEnd: '2019-02-01', description: 'Brindar atención al cliente por medio telefónico a clientes de empresa de telefonía española.' },
        // { jobTitle: 'Full-Stack Developer', company: 'WebLab', dateStart: '2024-01-10', dateEnd: '2024-05-10', description: 'Boston' },
        // { jobTitle: 'Project Manager', company: 'ProjectPro', dateStart: '2024-01-10', dateEnd: '2024-05-10', description: 'Seattle' },
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
