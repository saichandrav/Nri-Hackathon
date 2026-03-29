const STRICT_LATEX_TEMPLATE = String.raw`\documentclass[10pt, letterpaper]{article}

% Packages:
\usepackage[
    ignoreheadfoot,
    top=0.51 cm,
    bottom=0.5 cm,
    left=1.2 cm,
    right=1.2 cm,
    footskip=1.0 cm,
]{geometry}
\usepackage{titlesec}
\usepackage{tabularx}
\usepackage{array}
\usepackage[dvipsnames]{xcolor}
\definecolor{primaryColor}{RGB}{0, 0, 180}
\usepackage{enumitem}
\usepackage{fontawesome5}
\usepackage{amsmath}
\usepackage[
    pdftitle={vs chandra's cv},
    pdfauthor={chandu},
    pdfcreator={LaTeX with RenderCV},
    colorlinks=true,
    urlcolor=primaryColor
]{hyperref}
\usepackage[pscoord]{eso-pic}
\usepackage{calc}
\usepackage{bookmark}
\usepackage{lastpage}
\usepackage{changepage}
\usepackage{paracol}
\usepackage{ifthen}
\usepackage{needspace}
\usepackage{iftex}

\ifPDFTeX
    \input{glyphtounicode}
    \pdfgentounicode=1
    \usepackage[T1]{fontenc}
    \usepackage[utf8]{inputenc}
    \usepackage{lmodern}
\fi

\usepackage{charter}

\raggedright
\AtBeginEnvironment{adjustwidth}{\partopsep0pt}
\pagestyle{empty}
\setcounter{secnumdepth}{0}
\setlength{\parindent}{0pt}
\setlength{\topskip}{0pt}
\setlength{\columnsep}{0.15cm}
\pagenumbering{gobble}

\titleformat{\section}{\needspace{4\baselineskip}\bfseries\large}{}{0pt}{}[\vspace{1pt}\titlerule]

\titlespacing{\section}{1pt}{0.2 cm}{0.15 cm}

\renewcommand\labelitemi{$\vcenter{\hbox{\small$\bullet$}}$}
\newenvironment{highlights}{
    \begin{itemize}[
        topsep=0.10cm,
        parsep=0.10 cm,
        partopsep=0pt,
        itemsep=0pt,
        leftmargin=0 cm + 10pt
    ]
}{
    \end{itemize}
}

\newenvironment{highlightsforbulletentries}{
    \begin{itemize}[
        topsep=0.10 cm,
        parsep=0.10 cm,
        partopsep=0pt,
        itemsep=0pt,
        leftmargin=10pt
    ]
}{
    \end{itemize}
}

\newenvironment{onecolentry}{
    \begin{adjustwidth}{0 cm + 0.00001 cm}{0 cm + 0.00001 cm}
}{
    \end{adjustwidth}
}

\newenvironment{twocolentry}[2][]{
    \onecolentry
    \def\secondColumn{#2}
    \setcolumnwidth{\fill, 4.5 cm}
    \begin{paracol}{2}
}{
    \switchcolumn \raggedleft \secondColumn
    \end{paracol}
    \endonecolentry
}

\newenvironment{threecolentry}[3][]{
    \onecolentry
    \def\thirdColumn{#3}
    \setcolumnwidth{, \fill, 4.5 cm}
    \begin{paracol}{3}
    {\raggedright #2} \switchcolumn
}{
    \switchcolumn \raggedleft \thirdColumn
    \end{paracol}
    \endonecolentry
}

\newenvironment{header}{
    \setlength{\topsep}{0pt}\par\kern\topsep\centering\linespread{1.5}
}{
    \par\kern\topsep
}

\newcommand{\placelastupdatedtext}{
  \AddToShipoutPictureFG*{
    \put(
        \LenToUnit{\paperwidth-2 cm-0 cm+0.05cm},
        \LenToUnit{\paperheight-1.0 cm}
    ){\vtop{{\null}\makebox[0pt][c]{
        \small\color{gray}\textit{Last updated in September 2024}\hspace{\widthof{Last updated in September 2024}}
    }}}
  }
}

\let\hrefWithoutArrow\href

\begin{document}
    \newcommand{\AND}{\unskip
        \cleaders\copy\ANDbox\hskip\wd\ANDbox
        \ignorespaces
    }
    \newsavebox\ANDbox
    \sbox\ANDbox{$|$}

    \begin{header}
    \vspace*{0.8pt}
        \fontsize{25 pt}{25 pt}\selectfont Vinnakota Sai Chandra

        \vspace{1 pt}

        \normalsize
        \mbox{\hrefWithoutArrow{https://www.codechef.com/users/chandu_vi}{CODE CHEF}}%
        \kern 5.0 pt%
        \AND%
        \kern 5.0 pt%
        \mbox{\hrefWithoutArrow{mailto:chanduvinnakota26@gmail.com}{EMAIL}}%
        \kern 5.0 pt%
        \AND%
        \kern 5.0 pt%
        \mbox{\hrefWithoutArrow{tel:+91-7569321052}{PHONE NO}}%
        \kern 5.0 pt%
        \AND%
        \kern 5.0 pt%
        \mbox{\hrefWithoutArrow{https://leetcode.com/u/chanduvk/}{LEET CODE}}%
        \kern 5.0 pt%
        \AND%
        \kern 5.0 pt%
        \mbox{\hrefWithoutArrow{https://www.linkedin.com/in/sai-chandra-vinnakota/}{LINKEDIN}}%
        \kern 5.0 pt%
        \AND%
        \kern 5.0 pt%
        \mbox{\hrefWithoutArrow{https://github.com/saichandrav}{GITHUB}}%
    \end{header}

    \vspace{5 pt - 0.3 cm}

    \section{Career Objective}
    \begin{onecolentry}
        Computer Science undergraduate with strong foundations in \textbf{programming, data structures, and web development,} experienced in building responsive applications using
        \textbf{MERN stack (MongoDB, Express.js, React, Node.js).} Seeking an opportunity through the \textbf{Internship} to apply problem-solving skills, contribute to real-world software projects, and gain industry-level development experience.
    \end{onecolentry}

    \section{Experience}
\begin{twocolentry}{
    \href{https://drive.google.com/file/d/11SWBn2sRbK0y-eeDi8jD886UasnHbzb-/view?usp=sharing}{\textbf{Certificate}}
}
    \textbf{Google AI-ML Virtual Internship}
\end{twocolentry}

\begin{onecolentry}
    \begin{highlights}
        \item Completed a structured virtual internship focused on \textbf{problem-solving using Python} covering the end-to-end workflow of software-driven model development. Applied structured programming concepts to solve guided real-world use cases.
        \item Worked on hands-on labs involving \textbf{data preprocessing, logic implementation, model training, and evaluation} strengthening analytical and debugging skills.
        \item Developed an understanding of \textbf{responsible technology usage} documentation and iterative improvement through feedback-based assignments. Followed industry-standard development practices throughout implementation.
    \end{highlights}
\end{onecolentry}

\section{Education}
\begin{twocolentry}{
    aug 2024 – present
}
    \textbf{Chalapathi institute of engineering \& technology}, B-tech in CSE-AI\end{twocolentry}

\vspace{0.10 cm}
\begin{onecolentry}
    \begin{highlights}
        \item \textbf{Coursework:} Python programming, CS fundamentals, Full-Stack Web Development using MERN
    \end{highlights}
\end{onecolentry}

\vspace{0.20 cm}
\begin{twocolentry}{
    2022 – 2024
}
    \textbf{Kendriya Vidyalaya Guntur (CBSE)}\end{twocolentry}
\begin{onecolentry}
    \begin{highlights}
     \item \textbf{AISSCE -  XII MPC }{GPA:} 7.05
     \end{highlights}
\end{onecolentry}

\section{Projects}
\begin{twocolentry}{
    \href{https://github.com/saichandrav/project-stark}{GitHub}
}
    \textbf{Project STARK | Python-based Real-Time Weapon Detection System}
\end{twocolentry}
\begin{onecolentry}
    \begin{highlights}
        \item Built a \textbf{real-time weapon detection system} using a \textbf{custom YOLO model} and \textbf{OpenCV} for live CCTV stream analysis.
        \item Developed a \textbf{Python-based backend} for frame processing, AI inference, alert generation, and evidence capture, with metadata stored in \textbf{SQLite} for offline use.
        \item Designed an \textbf{offline-first sync mechanism} to securely queue and synchronize detection logs and visual evidence upon network recovery, ensuring \textbf{zero data loss}.
    \end{highlights}
\end{onecolentry}

\vspace{0.2cm}

\begin{twocolentry}{
    Ongoing
}
    \textbf{NO DROP | Water Delivery Web Application}
\end{twocolentry}

\begin{onecolentry}
    \begin{highlights}
        \item Designed and developed a full-stack web application for water can subscription and on-demand delivery using the \textbf{MERN stack (MongoDB, Express.js, React.js, Node.js)}. Implemented \textbf{user authentication}, subscription management.
        \item Built \textbf{RESTful APIs} using Express.js and Node.js to handle orders, users, and delivery workflows.
        \item Integrated \textbf{MongoDB} for storing user data, orders, and subscription records with efficient data modeling.
        \item Developed a responsive front-end using \textbf{React.js and Tailwind CSS} to ensure cross-device compatibility and usability.
        \item Followed \textbf{industry-standard development practices} including modular code structure, version control using Git, and debugging workflows.
    \end{highlights}
\end{onecolentry}

\section{Technical Skills}
\begin{onecolentry}
    \begin{highlights}
        \item \textbf{Programming Languages:} Python, C, Java
        \item \textbf{Front-End Technologies:} JavaScript, React.js, Tailwind CSS, HTML, CSS
        \item \textbf{Backend \& Databases:}Express.js, Node.js, SQL, MongoDB, REST APIs
        \item \textbf{Computer Vision \& AI:} OpenCV, YOLO, Roboflow
        \item \textbf{Developer Tools:} Git, GitHub, VS Code
    \end{highlights}
\end{onecolentry}

\section{Certifications}
\begin{samepage}
\begin{twocolentry}{
\href{https://brm-certview.oracle.com/ords/certview/ecertificate?ssn=OC6601908&trackId=OCI25AICFA&key=81f223ec7c6650029267abf1330aaa3d3e321ec9}{LINK}\\
\href{https://www.credly.com/badges/3eb034a6-2c5c-4b04-b8fe-c2b1300b0543/public_url}{LINK}\\
\href{https://forage-uploads-prod.s3.amazonaws.com/completion-certificates/9PBTqmSxAf6zZTseP/io9DzWKe3PTsiS6GG_9PBTqmSxAf6zZTseP_wRoBSX5GrfWX5wzZs_1751718116830_completion_certificate.pdf}{LINK}
}
\vspace{0.10 cm}
\textbf{Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate.}\\
\textbf{Artificial Intelligence Fundamentals Issued by IBM SkillsBuild}\\
\textbf{Deloitte Australia Data Analytics Job Simulation on Forage - July 2025}\\
\textbf{TCS iON Career Edge - Young Professional}
\end{twocolentry}
\end{samepage}

\section{Achievements \& Extra Curricular Activities}
\begin{onecolentry}
\textbf{- Attended Rajya Puraskar Testing Camp}\\  A state level Acheivement in \textbf{Bharath scouts \& guides}(BSG)
one of the highest honors at the state level. \\
\textbf{- Secured 3rd place in "Just a Minute (JAM)" competition at Andhra Loyola College Technical Fest (2025).}
\end{onecolentry}

\end{document}
`;

module.exports = { STRICT_LATEX_TEMPLATE };
