
function initializeApp() {
    console.log("Notes app initialized");
    
    // Check if user is admin
    checkAdminStatus();
    
    // Initialize other event listeners
    const form = document.getElementById("note-form");
    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            saveNote();
        });
    }

    const searchBtn = document.getElementById("search-button");
    if (searchBtn) {
        searchBtn.addEventListener("click", searchNotes);
    }

    document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", function () {
            const noteId = this.getAttribute("data-note-id");
            deleteNote(noteId);
        });
    });
}

function checkAdminStatus() {
    fetch('/admin-check')
        .then(response => response.json())
        .then(data => {
            if (data.logged_in) {
                const adminNotice = document.querySelector('.admin-notice');
                if (adminNotice) {
                    adminNotice.style.display = 'flex';
                    
                    // Check if this notice was previously closed
                    const noticesClosed = JSON.parse(localStorage.getItem('closedAdminNotices') || '[]');
                    if (noticesClosed.includes('maintenance-notice')) {
                        adminNotice.style.display = 'none';
                    }
                }
            }
        })
        .catch(error => console.error('Error checking admin status:', error));
}

function closeAdminNotice(button) {
    const notice = button.closest('.admin-notice');
    if (notice) {
        // Animate the removal
        notice.style.opacity = '0';
        notice.style.transition = 'opacity 0.3s ease';
        
        // After animation, hide the element
        setTimeout(() => {
            notice.style.display = 'none';
        }, 300);
        
        // Store the closed state
        const noticesClosed = JSON.parse(localStorage.getItem('closedAdminNotices') || '[]');
        noticesClosed.push('maintenance-notice');
        localStorage.setItem('closedAdminNotices', JSON.stringify(noticesClosed));
    }
}

function saveNote() {
    console.log('Saving note...');
    
    const titleInput = document.querySelector('input[name="title"]');
    const contentInput = document.querySelector('textarea[name="content"]');
    
    if (!titleInput || !contentInput) {
        console.error('Cannot find title or content inputs');
        return;
    }
    
    const title = titleInput.value;
    const content = contentInput.value;
    
    console.log('Title:', title);
    console.log('Content:', content);
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    
    fetch('/apps/notes/create', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Save response:', data);
        
        if (data.success) {
            console.log('Note saved successfully');
            titleInput.value = '';
            contentInput.value = '';
            
            const notesList = document.getElementById('notes-list');
            const note = data.note;
            const noteHtml = `
                <div class="note-card">
                    <h3>${note.title}</h3>
                    <div class="note-content">${note.content}</div>
                    <div class="note-meta">
                        Created: ${note.created_at}
                        <button type="button" class="delete-note" data-note-id="${note.id}">Delete</button>
                    </div>
                </div>
            `;
            notesList.insertAdjacentHTML('afterbegin', noteHtml);
            
            const newDeleteButton = notesList.querySelector(`.delete-note[data-note-id="${note.id}"]`);
            if (newDeleteButton) {
                newDeleteButton.addEventListener('click', function() {
                    deleteNote(note.id);
                });
            }
        } else {
            console.error('Error saving note:', data.error || 'Unknown error');
            alert('Error saving note. Please try again.');
        }
    })
    .catch(error => {
        console.error('Fetch error:', error);
        alert('Error saving note. Please try again.');
    });
}

function searchNotes() {
    const query = document.getElementById('search').value;
    console.log('Searching for:', query);
    
    fetch(`/apps/notes/search?q=${encodeURIComponent(query)}`)
    .then(response => {
        console.log('Search response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Search results:', data);
        
        const notesList = document.getElementById('notes-list');
        if (!notesList) {
            console.error('Notes list element not found');
            return;
        }
        
        if (data.success && Array.isArray(data.notes)) {
            console.log(`Found ${data.notes.length} notes matching query`);
            
            if (data.notes.length === 0) {
                notesList.innerHTML = '<div class="note-card"><p>No notes found matching your search.</p></div>';
                return;
            }
            
            notesList.innerHTML = '';
            data.notes.forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'note-card';
                noteElement.innerHTML = `
                    <h3>${note.title}</h3>
                    <div class="note-content">${note.content}</div>
                    <div class="note-meta">
                        Created: ${note.created_at}
                        <button type="button" class="delete-note" data-note-id="${note.id}">Delete</button>
                    </div>
                `;
                notesList.appendChild(noteElement);
            });
            
            document.querySelectorAll('.delete-note').forEach(button => {
                button.addEventListener('click', function() {
                    const noteId = this.getAttribute('data-note-id');
                    deleteNote(noteId);
                });
            });
        } else {
            console.error('Search failed or returned invalid data');
            notesList.innerHTML = '<div class="note-card"><p>An error occurred while searching notes.</p></div>';
        }
    })
    .catch(error => {
        console.error('Search fetch error:', error);
        const notesList = document.getElementById('notes-list');
        if (notesList) {
            notesList.innerHTML = '<div class="note-card"><p>An error occurred while searching notes.</p></div>';
        }
    });
}

function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        console.log('Deleting note:', noteId);
        
        fetch(`/apps/notes/delete/${noteId}`, {
            method: 'DELETE'
        })
        .then(response => {
            console.log('Delete response status:', response.status);
            
            if (response.status === 404) {
                throw new Error('Note not found');
            }
            return response.json();
        })
        .then(data => {
            console.log('Delete response data:', data);
            
            if (data.success) {
                console.log('Note deleted successfully');
                
                // Find the note element using the correct class name
                const noteElement = document.querySelector(`.note-card:has(.delete-note[data-note-id="${noteId}"])`);
                if (noteElement) {
                    noteElement.remove();
                } else {
                    console.error('Note element not found');
                }
            } else {
                console.error('Delete failed:', data.error || 'Unknown error');
                alert('Error deleting note: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            alert('Error deleting note: ' + error.message);
        });
    }
}

function cleanupApp() {
    console.log('Cleaning up notes app');
    // Clear any event listeners if needed
}

window.initializeApp = initializeApp;
window.cleanupApp = cleanupApp;
window.closeAdminNotice = closeAdminNotice;

console.log('Notes script loaded and functions defined');
