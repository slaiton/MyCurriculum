import React, { useEffect, useState } from 'react';
import useScroll from '../../hooks/useScrollDetection';
import { motion } from "framer-motion";
import './Projects.css';

const ProjectReview = ({ onNavigate }) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const [canNavigate, setCanNavigate] = useState(false);


    const handleScroll = (event) => {
        if (!canNavigate) return;
        if (event.deltaY > 0) {
            onNavigate("#experience");
        } else if (event.deltaY < 0) {
            onNavigate("#contact");
        }
    };

    useScroll(handleScroll);

    const [repos, setRepos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 6;

    useEffect(() => {
        fetch("https://api.github.com/users/slaiton/repos")
            .then((res) => res.json())
            .then((data) => {
                const filtered = data
                    .filter(repo => !repo.fork) // Omitir forks
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Más recientes primero
                setRepos(filtered);
            })
            .catch((error) => console.error("Error al obtener repositorios:", error));
    }, []);

    const indexOfLastProject = currentPage * projectsPerPage;
    const indexOfFirstProject = indexOfLastProject - projectsPerPage;
    const currentProjects = repos.slice(indexOfFirstProject, indexOfLastProject);

    const totalPages = Math.ceil(repos.length / projectsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    const getBannerUrl = (repo) =>
        `https://raw.githubusercontent.com/slaiton/${repo.name}/main/banner.jpg`;

    return (
        <div className="projects-wrapper">
            <h1>Mis Proyectos</h1>
            <div className="projects-container">
                {currentProjects.map((repo) => (
                    <div key={repo.id} className="project-card">
                        <img
                            src={getBannerUrl(repo)}
                            alt={repo.name}
                            className="project-image"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/unavailable-image.jpg";
                            }}
                        />
                        <div className="project-info">
                            <h2>{repo.name}</h2>
                            <p>{repo.description || "Sin descripción disponible."}</p>
                            <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="project-link"
                            >
                                Ver en GitHub
                            </a>
                            {repo.language && (
                                <div className="tech-stack">
                                    <span className="tech-item">{repo.language}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Paginador */}
            <div className="pagination">
                {[...Array(totalPages).keys()].map((number) => (
                    <button
                        key={number}
                        onClick={() => handlePageChange(number + 1)}
                        className={currentPage === number + 1 ? "active" : ""}
                    >
                        {number + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};


export default ProjectReview;