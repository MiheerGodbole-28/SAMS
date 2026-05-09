// public/app.js

document.addEventListener('DOMContentLoaded', () => {
    fetchStudents();
});

// Fetch student data from the backend
async function fetchStudents() {
    try {
        const response = await fetch('/api/students');
        const students = await response.json();
        renderStudents(students);
    } catch (error) {
        console.error('Error fetching students:', error);
    }
}

// Dynamically render the table using DOM manipulation
function renderStudents(students) {
    const studentList = document.getElementById('student-list');
    studentList.innerHTML = ''; // Clear existing rows

    students.forEach(student => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td><span class="status-badge ${student.status.toLowerCase()}">${student.status}</span></td>
            <td>
                <button class="btn-present" onclick="updateAttendance(${student.id}, 'Present')">Present</button>
                <button class="btn-absent" onclick="updateAttendance(${student.id}, 'Absent')">Absent</button>
            </td>
        `;
        studentList.appendChild(tr);
    });

    // Update summary counts
    const present = students.filter(s => s.status === 'Present').length;
    const absent  = students.filter(s => s.status === 'Absent').length;
    document.getElementById('count-total').textContent   = `Total: ${students.length}`;
    document.getElementById('count-present').textContent = `Present: ${present}`;
    document.getElementById('count-absent').textContent  = `Absent: ${absent}`;
}

// Update attendance via POST request
async function updateAttendance(id, status) {
    // Disable all buttons while request is in-flight to prevent double-clicks
    const buttons = document.querySelectorAll('button');
    document.querySelectorAll('button').forEach(b => b.disabled = true);

    try {
        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, status })
        });

        const result = await response.json();

        if (result.success) {
            // Re-fetch and re-render the list to show updated data
            await fetchStudents();
        } else {
            alert('Failed to update attendance.');
        }
    } catch (error) {
        console.error('Error fetching students:', error);
        document.getElementById('student-list').innerHTML = '<tr><td colspan="4">Failed to load students. Please refresh.</td></tr>';
    } finally {
        // Re-enable buttons whether request succeeded or failed
        buttons.forEach(b => b.disabled = false);
    }
}