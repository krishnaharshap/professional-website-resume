// Load resume data from JSON file
async function loadResumeData() {
    try {
        const response = await fetch('data/resume-data.json');
        const data = await response.json();
        populateResume(data);
        initNavigation();
    } catch (error) {
        console.error('Error loading resume data:', error);
        document.getElementById('name').textContent = 'Error loading resume data';
        document.getElementById('summary').textContent = 'Please check that resume-data.json exists and is valid JSON.';
    }
}

// Populate the resume with data
function populateResume(data) {
    // Header
    document.getElementById('name').textContent = data.name;
    document.getElementById('title').textContent = data.title;
    
    // Contact Info
    const contactHTML = `
        <span>Email: ${data.contact.email}</span>
        <span>Phone: ${data.contact.phone}</span>
        <span>Location: ${data.contact.location}</span>
        ${data.contact.linkedin ? `<span><a href="${data.contact.linkedin}" target="_blank">LinkedIn</a></span>` : ''}
        ${data.contact.github ? `<span><a href="${data.contact.github}" target="_blank">GitHub</a></span>` : ''}
    `;
    document.getElementById('contact').innerHTML = contactHTML;

    // Summary
    document.getElementById('summary').textContent = data.summary;

    // Skills
    const skillsHTML = data.skills.map(skill => `
        <div class="skill-category">
            <h3>${skill.category}</h3>
            <p>${skill.items.join(', ')}</p>
        </div>
    `).join('');
    document.getElementById('skills').innerHTML = skillsHTML;

    // Experience
    const experienceHTML = data.experience.map(job => `
        <div class="experience-item">
            <div class="experience-header">
                <h3>${job.position}</h3>
                <span class="experience-date">${job.duration}</span>
            </div>
            <p class="company">${job.company} | ${job.location}</p>
            <ul>
                ${job.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
            </ul>
        </div>
    `).join('');
    document.getElementById('experience').innerHTML = experienceHTML;

    // Projects
    if (data.projects && data.projects.length > 0) {
        const projectsHTML = data.projects.map(proj => `
            <div class="project-item">
                <h3>${proj.name}</h3>
                <p>${proj.description}</p>
                <p><strong>Technologies:</strong> ${proj.technologies}</p>
                ${proj.link ? `<p><a href="${proj.link}" target="_blank">View Project</a></p>` : ''}
            </div>
        `).join('');
        document.getElementById('projects').innerHTML = projectsHTML;
    } else {
        document.getElementById('projects-section').style.display = 'none';
    }

    // Education
    const educationHTML = data.education.map(edu => `
        <div class="education-item">
            <h3>${edu.degree}</h3>
            <p>${edu.institution} | ${edu.year}</p>
        </div>
    `).join('');
    document.getElementById('education').innerHTML = educationHTML;

    // Certifications
    if (data.certifications && data.certifications.length > 0) {
        const certificationsHTML = data.certifications.map(cert => `
            <div class="cert-item">
                <h3>${cert.name}</h3>
                <p>${cert.issuer} | ${cert.year}</p>
                ${cert.details && cert.details.length > 0 ? `
                    <div class="cert-details">
                        <ul>
                            ${cert.details.map(detail => `<li>${detail}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `).join('');
        document.getElementById('certifications').innerHTML = certificationsHTML;
    } else {
        document.getElementById('certifications-section').style.display = 'none';
    }

    // Last Updated
    document.getElementById('last-updated').textContent = new Date().toLocaleDateString();
}

// Navigation
let currentPage = 0;
const totalPages = 4;

function initNavigation() {
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const pages = document.getElementById('pages');

    prevBtn.addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            updatePage();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages - 1) {
            currentPage++;
            updatePage();
        }
    });

    updatePage();
}

function updatePage() {
    const pages = document.getElementById('pages');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');

    pages.style.transform = `translateX(-${currentPage * 25}%)`;

    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage === totalPages - 1;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadResumeData);
