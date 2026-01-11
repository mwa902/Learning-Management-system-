// hubpage.js - UMD Version
document.addEventListener('DOMContentLoaded', async () => {
    const studentId = sessionStorage.getItem('student_id');

    if (!studentId) {
        // Redirect to login if not logged in
        window.location.href = '../loginpage.html';
        return;
    }

    try {
        // Fetch student details
        const { data: student, error } = await supabaseClient
            .from('student')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (error) {
            console.error('Error fetching student:', error);
            // alert('Failed to load student data'); // Optional to avoid spamming alerts
            return;
        }

        if (student) {
            const welcomeMsg = document.getElementById('welcome-msg');
            if (welcomeMsg) welcomeMsg.textContent = `Welcome, ${student.name}`;
            console.log('Student loaded:', student.name);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
});
