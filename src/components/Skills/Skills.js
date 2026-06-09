import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useScroll from '../../hooks/useScrollDetection';
import './Skills.css';

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

function Skills({ onNavigate }) {
   const [started, setStarted] = useState(false);

   useEffect(() => {
      const t = setTimeout(() => setStarted(true), 100);
      return () => clearTimeout(t);
   }, []);

   const handleScroll = (event) => {
      if (event.deltaY > 0) {
         onNavigate("#projects");
      } else if (event.deltaY < 0) {
         onNavigate("#experience");
      }
   };

   useScroll(handleScroll);

   return (
      <motion.section
         initial={{ y: '-100vh', opacity: 0 }}
         animate={{ y: '0', opacity: 1 }}
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
                        style={{
                           width: started ? `${skill.percentage}%` : '0%',
                           transition: 'width 1.5s ease-out',
                        }}
                     />
                  </div>
                  <span className="percentage">{skill.percentage}%</span>
               </div>
            ))}
         </div>
      </motion.section>
   );
}

export default Skills;
