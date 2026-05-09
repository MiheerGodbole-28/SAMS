// server.js
require('dotenv').config(); // Make sure your file is named exactly .env
const express = require('express');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to log activities
const logActivity = (action) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    const logMessage = `[${timestamp}] ${action}\n`;

    fs.appendFile(path.join(__dirname, 'activity.log'), logMessage, (err) => {
        if (err) console.error('Failed to write to log file:', err);
    });
};

// Route: Get all students from Supabase
app.get('/api/students', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('id');

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error fetching students:', error.message);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Route: Update attendance in Supabase
app.post('/api/attendance', async (req, res) => {
    const { id, status } = req.body;

    // Validate request body before hitting the database
    if (!id || !['Present', 'Absent'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid request body' });
    }

    try {
        const { data, error } = await supabase
            .from('students')
            .update({ status: status })
            .eq('id', id)
            .select(); // returns the updated row data

        if (error) throw error;

        if (data && data.length > 0) {
            const updatedStudent = data[0];
            logActivity(`Attendance Updated: Student ID ${id} (${updatedStudent.name}) marked as ${status}.`);
            res.json({ success: true, student: updatedStudent });
        } else {
            res.status(404).json({ success: false, message: 'Student not found' });
        }
    } catch (error) {
        console.error('Error updating attendance:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update database' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server Running at http://localhost:${PORT}`);
    logActivity('Server started and connected to Supabase.');
});