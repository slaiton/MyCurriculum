import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useScroll from '../../hooks/useScrollDetection';


import './Skills.css';


function Skills({ onNavigate }) {
   const [isVisible, setIsVisible] = React.useState(true);

   const skills = [
      { name: "PHP", percentage: 95 },
      { name: "JavaScript", percentage: 90 },
      { name: "C#", percentage: 65 },
      { name: "Kotlin", percentage: 80 },
      { name: "TypeScript", percentage: 75 },
      { name: "Laravel", percentage: 95 },
      { name: "Angular", percentage: 85 },
      { name: "SQL", percentage: 95 },
      { name: "Console", percentage: 80 },
      { name: "React", percentage: 60 },
      { name: "AWS", percentage: 50 },
      { name: "Docker", percentage: 60 },
      { name: "Git", percentage: 80 },
   ];

   const [progress, setProgress] = useState(skills.map(() => 0));

   useEffect(() => {
      const interval = setInterval(() => {
         setProgress((prev) =>
            prev.map((value, index) =>
               value < skills[index].percentage ? value + 1 : value
            )
         );
      }, 20);

      return () => clearInterval(interval);
   }, [skills]);

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
         onNavigate("#contact");
      } else if (event.deltaY < 0) {
         onNavigate("#experience");
      }
   };

   useScroll(handleScroll);

   return (
      <motion.section
         initial={{ y: '-100vh', opacity: 0 }}
         animate={{ y: isVisible ? '0' : '-100vh', opacity: isVisible ? 1 : 0 }}
         exit={{ y: '-100vh', opacity: 0 }}
         transition={{ type: 'spring', stiffness: 300, damping: 20 }}
         id="skills" className="skills">
         <div className='skills-title'>
            <h1>My Skills</h1>
         </div>

         <div className="skills-container">
            {skills.map((skill, index) => (
               <div key={index} className="skill">
                  <span className="skill-name">{skill.name}</span>
                  <div className="progress-bar-container">
                     <div
                        className="progress-bar"
                        style={{ width: `${progress[index]}%` }}
                     ></div>
                  </div>
                  <span className="percentage">{progress[index]}%</span>
               </div>
            ))}
         </div>


      </motion.section>
   );
}

export default Skills;
