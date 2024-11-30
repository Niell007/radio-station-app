// Show loading spinner
function showLoadingSpinner(container) {
    const spinner = document.createElement('div');
    spinner.classList.add('spinner-border', 'text-light');
    spinner.role = 'status';
    spinner.innerHTML = '<span class="sr-only">Loading...</span>';
    container.appendChild(spinner);
}

// Remove loading spinner
function removeLoadingSpinner(container) {
    const spinner = container.querySelector('.spinner-border');
    if (spinner) {
        container.removeChild(spinner);
    }
}

// Error handling
function showError(container, message) {
    container.innerHTML = `<div class="alert alert-danger" role="alert">${message}</div>`;
}

// Persistent user greeting
document.addEventListener('DOMContentLoaded', () => {
    const storedName = localStorage.getItem('username');
    if (storedName) {
        document.getElementById('greeting-output').innerText = `Welcome back, ${storedName}!`;
    }
    initializeButtonHoverEffects();
});

document.getElementById('greet-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const nameInput = document.getElementById('name-input');
    const name = nameInput.value.trim();
    const messageContainer = document.getElementById('greeting-output');
    messageContainer.innerText = '';

    // Input validation
    if (!name) {
        showError(messageContainer, 'Please enter your name.');
        return;
    }

    showLoadingSpinner(messageContainer);

    try {
        const response = await fetch(`/greet/${encodeURIComponent(name)}`);
        if (!response.ok) throw new Error('Failed to fetch greeting.');
        const greeting = await response.text();
        localStorage.setItem('username', name); // Store name in local storage
        messageContainer.innerText = greeting;
    } catch (error) {
        showError(messageContainer, error.message);
    } finally {
        removeLoadingSpinner(messageContainer);
    }
});

document.getElementById('search-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';

    // Input validation
    if (!query) {
        showError(resultsContainer, 'Please enter a search query.');
        return;
    }

    showLoadingSpinner(resultsContainer);

    const useStreaming = false;
    const endpoint = useStreaming ? '/stream' : '/search';

    try {
        const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch search results.');
        const results = await response.json();

        if (results.error) {
            showError(resultsContainer, results.error);
        } else {
            results.forEach(result => {
                const resultElement = document.createElement('div');
                resultElement.className = 'result-item';
                resultElement.textContent = result;
                resultsContainer.appendChild(resultElement);
            });
        }
    } catch (error) {
        showError(resultsContainer, error.message);
    } finally {
        removeLoadingSpinner(resultsContainer);
    }
});

document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const songFile = document.getElementById('songFile').files[0];
    const uploadResult = document.getElementById('uploadResult');
    const audioPlayer = document.getElementById('audioPlayer');
    const progressBar = document.getElementById('progressBar').firstElementChild;

    if (!songFile) {
        showError(uploadResult, 'Please select a file to upload.');
        return;
    }

    showLoadingSpinner(uploadResult);

    try {
        const formData = new FormData();
        formData.append('songFile', songFile);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error('Failed to upload file.');
        const result = await response.json();

        if (result.success) {
            uploadResult.innerHTML = `<div class="alert alert-success" role="alert">File uploaded successfully!</div>`;
            audioPlayer.src = URL.createObjectURL(songFile);
            audioPlayer.play();

            // Track upload progress
            const intervalId = setInterval(async () => {
                const progressResponse = await fetch(`/progress/${encodeURIComponent(songFile.name)}`);
                const progressData = await progressResponse.json();

                if (progressData.progress >= 100) {
                    clearInterval(intervalId);
                }

                progressBar.style.width = `${progressData.progress}%`;
            }, 1000);
        } else {
            showError(uploadResult, result.error || 'Unknown error occurred.');
        }
    } catch (error) {
        showError(uploadResult, error.message);
    } finally {
        removeLoadingSpinner(uploadResult);
    }
});

// Button hover effects
function initializeButtonHoverEffects() {
    const buttons = document.querySelectorAll('[data-hover-image]');
    buttons.forEach(button => {
        const defaultImage = button.src;
        const hoverImage = button.dataset.hoverImage;
        
        button.addEventListener('mouseenter', () => {
            button.src = hoverImage;
        });
        
        button.addEventListener('mouseleave', () => {
            button.src = defaultImage;
        });
    });
}
