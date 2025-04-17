import React, { useEffect, useState } from 'react';
import useScroll from '../../hooks/useScrollDetection';
import { motion } from "framer-motion";
import './Projects.css';

const ProjectReview = ({ onNavigate }) => {
    const [canNavigate, setCanNavigate] = useState(false);
    const [repos, setRepos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRepo, setSelectedRepo] = useState(null);

    const projectsPerPage = 6;

    useScroll((event) => {
        if (!canNavigate) return;
        if (event.deltaY > 0) {
            onNavigate("#experience");
        } else if (event.deltaY < 0) {
            onNavigate("#contact");
        }
    });

    useEffect(() => {
        fetch("https://api.github.com/users/slaiton/repos")
            .then((res) => res.json())
            .then((data) => {
                const filtered = data
                    .filter(repo => !repo.fork)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setRepos(filtered);
            })
            .catch((error) => console.error("Error al obtener repositorios:", error));
    }, []);

    const getBannerUrl = (repo) =>
        `https://raw.githubusercontent.com/slaiton/${repo.name}/main/banner.jpg`;

    const indexOfLastProject = currentPage * projectsPerPage;
    const indexOfFirstProject = indexOfLastProject - projectsPerPage;
    const currentProjects = repos.slice(indexOfFirstProject, indexOfLastProject);
    const totalPages = Math.ceil(repos.length / projectsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleCardClick = (repo) => {
        setSelectedRepo(repo);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        setSelectedRepo(null);
    };

    return (
        <div className="projects-wrapper">
            <h1>Mis Proyectos</h1>

            {selectedRepo ? (
                <motion.div
                className="project-detail"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
            >
                <div className="overlay" onClick={handleBack}></div>
                <div className="project-detail-content">
                    <button className="back-button" onClick={handleBack}>X</button>
                    <h2>{selectedRepo.name}</h2>
                    <img
                        src={getBannerUrl(selectedRepo)}
                        alt={selectedRepo.name}
                        className="project-image-large"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/unavailable-image.jpg";
                        }}
                    />
                    <p>{selectedRepo.description || "Sin descripción disponible."}</p>
                    <p><strong>Lenguaje:</strong> {selectedRepo.language || "No especificado"}</p>
                    <p><strong>Creado:</strong> {new Date(selectedRepo.created_at).toLocaleDateString()}</p>
                    <p><strong>Última actualización:</strong> {new Date(selectedRepo.updated_at).toLocaleDateString()}</p>
                    <a href={selectedRepo.html_url} target="_blank" rel="noopener noreferrer">
                        Ver en GitHub
                    </a>
                </div>
            </motion.div>
            ) : (
                <>
                    <motion.div
                        className="projects-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5 }}
                    >
                        {currentProjects.map((repo) => (
                            <motion.div
                                key={repo.id}
                                className="project-card"
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleCardClick(repo)}
                            >
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
                                    {repo.language && (
                                        <div className="tech-stack">
                                            <span className="tech-item">{repo.language}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

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
                </>
            )}
        </div>
    );
};

export default ProjectReview;