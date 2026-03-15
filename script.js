// 1. TYPEWRITER EFFECT
const words = ["MERN Stack Developer", "Full Stack Developer", "React & Node.js Enthusiast"];
let i = 0;
let timer;

function typingEffect() {
    let wordElement = document.getElementById('typewriter');
    if (!wordElement) return;

    let word = words[i].split("");
    var loopTyping = function() {
        if (word.length > 0) {
            wordElement.innerHTML += word.shift();
        } else {
            setTimeout(deletingEffect, 2000);
            return false;
        }
        timer = setTimeout(loopTyping, 100);
    };
    loopTyping();
}

function deletingEffect() {
    let wordElement = document.getElementById('typewriter');
    if (!wordElement) return;

    let word = words[i].split("");
    var loopDeleting = function() {
        if (word.length > 0) {
            word.pop();
            wordElement.innerHTML = word.join("");
        } else {
            if (words.length > (i + 1)) {
                i++;
            } else {
                i = 0;
            }
            typingEffect();
            return false;
        }
        timer = setTimeout(loopDeleting, 50);
    };
    loopDeleting();
}

typingEffect(); 

// 2. SCROLL ANIMATION & SVG SKILL PROGRESS
const observerOptions = { threshold: 0.2 }; 

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show-anim');
            
            // Trigger SVG circle drawing
            if (entry.target.classList.contains('skill-circle-item')) {
                animateSkillCircle(entry.target);
            }
        }
    });
}, observerOptions);

const hiddenElements = document.querySelectorAll('.hidden-anim');
hiddenElements.forEach((el) => observer.observe(el));

// Math for SVG Circular progress
const totalCircumference = 2 * Math.PI * 15.9155; 

function animateSkillCircle(skillItem) {
    const circleProgress = skillItem.querySelector('.circle-progress');
    const targetPercent = skillItem.getAttribute('data-percent');
    const targetStrokeLength = totalCircumference * (targetPercent / 100);
    
    circleProgress.style.strokeDasharray = `${targetStrokeLength} ${totalCircumference}`;
}