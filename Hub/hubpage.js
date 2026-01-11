// hubpage.js - UMD Version
const SUPABASE_URL = "https://eymsxizmkiteggxakfpc.supabase.co";
const SUPABASE_KEY = "sb_publishable_hUxdhiQdpIuxeFUpFO2ueg_z7YCSmKg";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase Client Initialized');

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
