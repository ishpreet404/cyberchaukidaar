import React from 'react';

export const ASCIIArt = ({ variant = 'logo' }) => {
  const logos = {
      logo: `
                                
                                ░█▀▀░█░█░█▀▄░█▀▀░█▀▄░░░█▀▀░█░█░█▀█░█░█░█░█░▀█▀░█▀▄░█▀█░█▀█░█▀▄
                                ░█░░░░█░░█▀▄░█▀▀░█▀▄░░░█░░░█▀█░█▀█░█░█░█▀▄░░█░░█░█░█▀█░█▀█░█▀▄
                                ░▀▀▀░░▀░░▀▀░░▀▀▀░▀░▀░░░▀▀▀░▀░▀░▀░▀░▀▀▀░▀░▀░▀▀▀░▀▀░░▀░▀░▀░▀░▀░▀      
    
                                                                                                                         
     `,
    shield: `

      ┌────────────────────────────
      │ root@security:~# █        
      │ ░░░ ACCESS GRANTED         
      │ ████ ENCRYPTING DATA ████  
      │ ████ BYPASS FIREWALL ████  
      │ ░░░ TRACE HIDDEN ░░░      
      └────────────────────────────
      `,
    warning: `
        /\\
       /  \\
      / /\\ \\
     / ____ \\
    /_/    \\_\\
       !!
    `,
  };

  return (
    <pre className="text-terminal-green text-shadow-terminal leading-tight">
      {logos[variant]}
    </pre>
  );
};

export default ASCIIArt;
