# Professional Resume Website

A resume website for Software Quality Assurance positions.

## Live Site
View at: https://github.com/krishnaharshap/professional-website-resume

## Features
- Modular JSON-based content management
- Mobile-responsive design
- Print-friendly PDF generation
- Modern, professional styling with Inter font
- Easy to update and maintain
- ATS-optimized structure

## Project Structure
```
resume-website/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
├── data/
│   └── resume-data.json
├── assets/
│   └── images/
│       └── profile.jpg (optional)
├── README.md
└── .gitignore
```

## Quick Start

### View Locally
1. Open index.html in your browser
2. Or use Live Server in VS Code

### Deploy to GitHub Pages
```bash
git init
git add .
git commit -m "Initial resume website"
git branch -M main
git remote add origin https://github.com/krishnaharshap/professional-website-resume.git
git push -u origin main
```

### Enable GitHub Pages
1. Go to repository Settings
2. Navigate to Pages section
3. Set Source to: Branch main, Folder / (root)
4. Save and wait 2-3 minutes
5. Your site will be live!

## Updating Your Resume

Edit data/resume-data.json with your information, then:

```bash
git add data/resume-data.json
git commit -m "Update resume content"
git push origin main
```

## Customization

### Change Colors
Edit :root variables in css/styles.css

### Add Profile Photo
1. Add image to assets/images/profile.jpg
2. Update header section in index.html

## ATS Optimization
This template is ATS-friendly with:
- Clean semantic HTML structure
- Standard section headings
- Plain text content
- Professional font
- Proper heading hierarchy

## Tips for Senior QA Analyst Roles
Include keywords like:
- Selenium, Cypress, Playwright
- Java, Python, JavaScript
- Jenkins, GitHub Actions
- Agile, Scrum, TDD
- REST Assured, Postman
- JMeter, LoadRunner
