// Load resume data from JSON file
async function loadResumeData() {
    try {
        const response = await fetch('data/resume-data.json');
        const data = await response.json();
        populateResume(data);
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
            </div>
        `).join('');
        document.getElementById('certifications').innerHTML = certificationsHTML;
    } else {
        document.getElementById('certifications-section').style.display = 'none';
    }

    // Last Updated
    document.getElementById('last-updated').textContent = new Date().toLocaleDateString();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadResumeData);
