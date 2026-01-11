// personalpage.js - UMD Version
const SUPABASE_URL = "https://eymsxizmkiteggxakfpc.supabase.co";
const SUPABASE_KEY = "sb_publishable_hUxdhiQdpIuxeFUpFO2ueg_z7YCSmKg";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase Client Initialized');

document.addEventListener('DOMContentLoaded', async () => {
    const studentId = sessionStorage.getItem('student_id');

    if (!studentId) {
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

        // Fetch username from auth table
        const { data: authData } = await supabaseClient
            .from('user_auth')
            .select('username')
            .eq('student_id', studentId)
            .single();

        if (error) {
            console.error('Error fetching student:', error);
            return;
        }

        if (student) {
            const setText = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value || 'N/A';
            };

            setText('student-name', student.name);
            setText('student-email', student.email);
            setText('student-program', student.program);
            setText('student-semester', student.semester);
            setText('student-batch', student.batch);
            setText('student-phone', student.phone_no);

            if (authData) {
                setText('student-username', authData.username);
            }
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
});
