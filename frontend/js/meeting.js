function toggleMeetingTypeFields(type) {
    document.getElementById('realTimeFields').style.display = type === 'real-time' ? 'block' : 'none';
    document.getElementById('virtualFields').style.display = type === 'virtual' ? 'block' : 'none';
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                document.getElementById('latitude').value = position.coords.latitude;
                document.getElementById('longitude').value = position.coords.longitude;
            },
            (error) => alert('Error getting location: ' + error.message)
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You need to log in to access this page.');
        window.location.href = 'login.html';
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);

    // Create/Edit Meeting
    const meetingForm = document.getElementById('meetingForm');
    if (meetingForm) {
        const editMeetingId = urlParams.get('edit');
        if (editMeetingId) {
            document.getElementById('formTitle').textContent = 'Edit Meeting';
            document.getElementById('submitButton').textContent = 'Update Meeting';
            console.log('Fetching meeting with ID:', editMeetingId); // Debug
            console.log('Token:', token); // Debug
            fetch(`http://localhost:5001/api/v1/meetings/${editMeetingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(response => {
                console.log('Fetch status:', response.status); // Debug
                if (response.status === 401) {
                    alert('Session expired. Please log in again.');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return Promise.reject('Unauthorized');
                }
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Fetch response:', data); // Debug
                if (data.success && data.data) {
                    const meeting = data.data;
                    document.getElementById('title').value = meeting.title || '';
                    document.getElementById('description').value = meeting.description || '';
                    document.getElementById('type').value = meeting.type || 'real-time';
                    document.getElementById('date').value = new Date(meeting.date).toISOString().slice(0, 16);
                    toggleMeetingTypeFields(meeting.type);
                    if (meeting.type === 'real-time' && meeting.location) {
                        document.getElementById('address').value = meeting.location.address || '';
                        document.getElementById('latitude').value = meeting.location.coordinates?.[1] || '';
                        document.getElementById('longitude').value = meeting.location.coordinates?.[0] || '';
                    } else if (meeting.type === 'virtual') {
                        document.getElementById('virtualLink').value = meeting.virtualLink || '';
                    }
                } else {
                    document.getElementById('message').textContent = data.error || 'Failed to load meeting';
                    document.getElementById('message').style.color = 'red';
                }
            })
            .catch(error => {
                console.error('Error fetching meeting:', error);
                if (error !== 'Unauthorized') {
                    document.getElementById('message').textContent = 'Error loading meeting';
                    document.getElementById('message').style.color = 'red';
                }
            });
        }

        document.getElementById('type').addEventListener('change', (e) => toggleMeetingTypeFields(e.target.value));

        meetingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const meetingData = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                type: document.getElementById('type').value,
                date: document.getElementById('date').value
            };
            if (meetingData.type === 'real-time') {
                meetingData.latitude = document.getElementById('latitude').value;
                meetingData.longitude = document.getElementById('longitude').value;
                meetingData.address = document.getElementById('address').value;
            } else if (meetingData.type === 'virtual') {
                meetingData.virtualLink = document.getElementById('virtualLink').value;
            }
            const url = editMeetingId ? `http://localhost:5001/api/v1/meetings/${editMeetingId}` : 'http://localhost:5001/api/v1/meetings';
            const method = editMeetingId ? 'PUT' : 'POST';
            console.log('Submitting data:', meetingData); // Debug
            console.log('Token:', token); // Debug
            fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(meetingData)
            })
            .then(response => {
                console.log('Submit status:', response.status); // Debug
                if (response.status === 401) {
                    alert('Session expired. Please log in again.');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return Promise.reject('Unauthorized');
                }
                if (!response.ok) throw new Error(`HTTP error ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log('Submit response:', data); // Debug
                document.getElementById('message').textContent = data.success ? 
                    (editMeetingId ? 'Meeting updated successfully!' : 'Meeting created successfully!') : 
                    (data.error || 'Error occurred');
                document.getElementById('message').style.color = data.success ? 'green' : 'red';
                if (data.success) setTimeout(() => window.location.href = 'dashboard.html', 1500);
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                if (error !== 'Unauthorized') {
                    document.getElementById('message').textContent = 'Error occurred while updating';
                    document.getElementById('message').style.color = 'red';
                }
            });
        });
    }

    // View Meetings
    if (document.getElementById('realTimeMeetings')) {
        fetch('http://localhost:5001/api/v1/meetings', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (response.status === 401) {
                alert('Session expired. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return Promise.reject('Unauthorized');
            }
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success && data.data) {
                const realTimeContainer = document.getElementById('realTimeMeetings');
                const virtualContainer = document.getElementById('virtualMeetings');
                const realTimeMeetings = data.data.filter(m => m.type === 'real-time');
                const virtualMeetings = data.data.filter(m => m.type === 'virtual');

                realTimeMeetings.length === 0 ? 
                    realTimeContainer.innerHTML = '<p class="col-12">No real-time meetings available.</p>' :
                    realTimeMeetings.forEach(m => {
                        realTimeContainer.innerHTML += `
                            <div class="col-md-4 meeting-card">
                                <div class="card">
                                    <h3>${m.title || 'Untitled'}</h3>
                                    <p>${m.description || 'No description'}</p>
                                    <p><i class="fas fa-calendar"></i> ${new Date(m.date).toLocaleString()}</p>
                                    <p><i class="fas fa-map-marker-alt"></i> ${m.location?.address || 'Not specified'}</p>
                                    <button class="btn btn-neu" onclick="viewMeeting('${m._id}')"><i class="fas fa-eye"></i> View</button>
                                    <button class="btn btn-neu" onclick="joinMeeting('${m._id}')"><i class="fas fa-sign-in-alt"></i> Join</button>
                                </div>
                            </div>`;
                    });

                virtualMeetings.length === 0 ? 
                    virtualContainer.innerHTML = '<p class="col-12">No virtual meetings available.</p>' :
                    virtualMeetings.forEach(m => {
                        virtualContainer.innerHTML += `
                            <div class="col-md-4 meeting-card">
                                <div class="card">
                                    <h3>${m.title || 'Untitled'}</h3>
                                    <p>${m.description || 'No description'}</p>
                                    <p><i class="fas fa-calendar"></i> ${new Date(m.date).toLocaleString()}</p>
                                    <p><i class="fas fa-link"></i> <a href="${m.virtualLink || '#'}" target="_blank">Join Link</a></p>
                                    <button class="btn btn-neu" onclick="viewMeeting('${m._id}')"><i class="fas fa-eye"></i> View</button>
                                    <button class="btn btn-neu" onclick="joinMeeting('${m._id}')"><i class="fas fa-sign-in-alt"></i> Join</button>
                                </div>
                            </div>`;
                    });
            }
        })
        .catch(error => console.error('Error fetching meetings:', error));
    }

    // Dashboard Meetings
    if (document.getElementById('meetings')) {
        fetch('http://localhost:5001/api/v1/meetings', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (response.status === 401) {
                alert('Session expired. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return Promise.reject('Unauthorized');
            }
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success && data.data) {
                const meetingsContainer = document.getElementById('meetings');
                data.data.length === 0 ? 
                    meetingsContainer.innerHTML = '<p class="col-12">No meetings created yet.</p>' :
                    data.data.forEach(m => {
                        meetingsContainer.innerHTML += `
                            <div class="col-md-4 meeting-card">
                                <div class="card">
                                    <h3>${m.title || 'Untitled'}</h3>
                                    <p><i class="fas fa-video"></i> ${m.type || 'N/A'}</p>
                                    <p><i class="fas fa-calendar"></i> ${new Date(m.date).toLocaleString()}</p>
                                    <button class="btn btn-neu" onclick="viewMeeting('${m._id}')"><i class="fas fa-eye"></i> View</button>
                                    <button class="btn btn-neu" onclick="editMeeting('${m._id}')"><i class="fas fa-edit"></i> Edit</button>
                                    <button class="btn btn-neu" onclick="deleteMeeting('${m._id}')"><i class="fas fa-trash"></i> Delete</button>
                                </div>
                            </div>`;
                    });
            }
        })
        .catch(error => console.error('Error fetching dashboard meetings:', error));
    }

    // Meeting Summary
    if (document.getElementById('meetingDetails')) {
        const meetingId = urlParams.get('id');
        if (!meetingId) {
            window.location.href = 'view-meetings.html';
            return;
        }
        fetch(`http://localhost:5001/api/v1/meetings/${meetingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (response.status === 401) {
                alert('Session expired. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return Promise.reject('Unauthorized');
            }
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success && data.data) {
                const m = data.data;
                const creatorName = m.creator?.username || 'Unknown';
                const creatorEmail = m.creator?.email || 'N/A';
                document.getElementById('meetingDetails').innerHTML = `
                    <div class="card">
                        <h2>${m.title || 'Untitled'}</h2>
                        <p><strong>Description:</strong> ${m.description || 'No description'}</p>
                        <p><strong>Type:</strong> ${m.type || 'N/A'}</p>
                        <p><strong>Date:</strong> ${new Date(m.date).toLocaleString()}</p>
                        <p><strong>Created by:</strong> ${creatorName} (${creatorEmail})</p>
                        ${m.type === 'real-time' ? `
                            <p><strong>Location:</strong> ${m.location?.address || 'Not specified'}</p>
                            <p><strong>Coordinates:</strong> ${m.location?.coordinates?.join(', ') || 'N/A'}</p>
                        ` : m.type === 'virtual' ? `
                            <p><strong>Link:</strong> <a href="${m.virtualLink || '#'}" target="_blank">${m.virtualLink || 'No link'}</a></p>
                        ` : ''}
                        <h3>Participants (${m.participants?.length || 0})</h3>
                        <ul id="participantsList">${m.participants?.length === 0 ? '<li>No participants yet</li>' : 
                            m.participants.map(p => `<li>${p.username || 'Unknown'} (${p.email || 'N/A'})</li>`).join('')}</ul>
                    </div>`;
            } else {
                window.location.href = 'view-meetings.html';
            }
        })
        .catch(error => {
            console.error('Error fetching meeting details:', error);
            if (error !== 'Unauthorized') {
                window.location.href = 'view-meetings.html';
            }
        });
    }
});

function viewMeeting(meetingId) {
    window.location.href = `meeting-summary.html?id=${meetingId}`;
}

function editMeeting(meetingId) {
    window.location.href = `create-meeting.html?edit=${meetingId}`;
}

function deleteMeeting(meetingId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in again.');
        window.location.href = 'login.html';
        return;
    }
    if (confirm('Are you sure you want to delete this meeting?')) {
        fetch(`http://localhost:5001/api/v1/meetings/${meetingId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (response.status === 401) {
                alert('Session expired. Please log in again.');
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return Promise.reject('Unauthorized');
            }
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Meeting deleted successfully');
                window.location.reload();
            } else {
                alert(data.error || 'Failed to delete meeting');
            }
        })
        .catch(error => {
            console.error('Error deleting meeting:', error);
            if (error !== 'Unauthorized') {
                alert('Error deleting meeting');
            }
        });
    }
}

function joinMeeting(meetingId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in again.');
        window.location.href = 'login.html';
        return;
    }
    fetch(`http://localhost:5001/api/v1/meetings/${meetingId}/join`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => {
        if (response.status === 401) {
            alert('Session expired. Please log in again.');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
            return Promise.reject('Unauthorized');
        }
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        return response.json();
    })
    .then(data => {
        alert(data.success ? 'Joined successfully!' : (data.error || 'Failed to join'));
        if (data.success) window.location.reload();
    })
    .catch(error => {
        console.error('Error joining meeting:', error);
        if (error !== 'Unauthorized') {
            alert('Error joining meeting');
        }
    });
}