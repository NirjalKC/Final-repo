console.log('Files.js loaded');

function initializeFileApp() {
    console.log('Initializing file app...');
    
    fetchCurrentFiles();
    
    attachFormHandler();
    
    console.log('File app initialized');
}

function fetchCurrentFiles() {
    console.log('Fetching current files...');
    
    fetch('/apps/files')
        .then(response => response.text())
        .then(html => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            const newFileList = tempDiv.querySelector('#file-list');
            const noFilesMessage = tempDiv.querySelector('.no-files');
            
            const fileListContainer = document.querySelector('.file-list');
            if (!fileListContainer) {
                console.error('File list container not found!');
                return;
            }
            
            if (newFileList && newFileList.children.length > 0) {
                console.log('Found', newFileList.children.length, 'files from server');
                
                let currentList = document.getElementById('file-list');
                if (!currentList) {
                    currentList = document.createElement('ul');
                    currentList.id = 'file-list';
                    
                    const existingNoFiles = fileListContainer.querySelector('.no-files');
                    if (existingNoFiles) {
                        existingNoFiles.remove();
                    }
                    
                    fileListContainer.appendChild(currentList);
                } else {
                    currentList.innerHTML = '';
                }
                
                Array.from(newFileList.children).forEach(item => {
                    currentList.appendChild(item.cloneNode(true));
                });
            } else if (noFilesMessage) {
                console.log('No files found');
                
                const existingList = document.getElementById('file-list');
                if (existingList) {
                    existingList.remove();
                }
                
                const existingNoFiles = fileListContainer.querySelector('.no-files');
                if (!existingNoFiles) {
                    const noFiles = document.createElement('div');
                    noFiles.className = 'no-files';
                    noFiles.textContent = "You haven't uploaded any files yet.";
                    fileListContainer.appendChild(noFiles);
                }
            }
            
            attachDeleteHandlers();
        })
        .catch(error => {
            console.error('Error fetching file list:', error);
        });
}

function attachFormHandler() {
    const form = document.getElementById('file-upload-form');
    const fileInput = document.getElementById('file');
    const allowedTypes = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.gif']);
    
    if (!form || !fileInput) {
        console.error('Form elements not found!');
        return;
    }
    
    if (form.dataset.handlerAttached) {
        return;
    }
    
    // Prevent drag and drop on the entire document
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    
    // File input change handler
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            if (!allowedTypes.has(extension)) {
                showMessage("error", "This file type is not allowed. Please select a PDF or image file.");
                e.target.value = ''; // Clear the input
            }
        }
    });
    
    form.dataset.handlerAttached = 'true';
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            showMessage("error", "Please select a file to upload");
            return;
        }
        
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.has(extension)) {
            showMessage("error", "This file type is not allowed");
            return;
        }
        
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) submitButton.disabled = true;
        
        const formData = new FormData(form);
        
        fetch('/apps/files/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (submitButton) submitButton.disabled = false;
            
            if (data.success) {
                showMessage("success", "File uploaded successfully!");
                form.reset();
                fetchCurrentFiles();
            } else {
                showMessage("error", "Error uploading file: " + (data.error || "Unknown error"));
            }
        })
        .catch(err => {
            console.error("Error:", err);
            showMessage("error", "Error uploading file");
            if (submitButton) submitButton.disabled = false;
        });
    });
}

function attachDeleteHandlers() {
    document.querySelectorAll('.delete-file').forEach(button => {
        button.removeEventListener('click', handleDelete);
        
        button.addEventListener('click', handleDelete);
        console.log('File operation completed');
    });
}

function handleDelete(e) {
    const fileId = this.getAttribute('data-file-id');
    console.log('File operation completed');
    
    if (confirm('Are you sure you want to delete this file?')) {
        fetch(`/apps/files/delete/${fileId}`, { 
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            console.log('File operation completed');
            if (data.success) {
                showMessage("success", "File deleted successfully");
                
                fetchCurrentFiles();
            } else {
                showMessage("error", "Error deleting file: " + (data.error || "Unknown error"));
            }
        })
        .catch(err => {
            console.error('Error:', err);
            showMessage("error", "Error deleting file");
        });
    }
}

function showMessage(type, message) {
    console.log(`Message: ${type} - ${message}`);
    
    const messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        console.error('Message container not found!');
        alert(message);
        return;
    }
    
    const msg = document.createElement('div');
    msg.classList.add(type === "success" ? 'success-message' : 'error-message');
    msg.textContent = message;
    messageContainer.appendChild(msg);
    
    setTimeout(() => msg.remove(), 3000);
}

window.cleanupApp = function() {
    console.log('Cleaning up file app...');
};

initializeFileApp();

window.initializeApp = function() {
    console.log('Initializing from window.initializeApp');
    initializeFileApp();
};
