// resultpage.js - UMD Version
const SUPABASE_URL = "https://eymsxizmkiteggxakfpc.supabase.co";
const SUPABASE_KEY = "sb_publishable_hUxdhiQdpIuxeFUpFO2ueg_z7YCSmKg";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('Supabase Client Initialized');

document.addEventListener('DOMContentLoaded', async () => {
    const resultsBody = document.getElementById('results-body');
    const studentId = sessionStorage.getItem('student_id');

    if (!studentId) {
        window.location.href = '../loginpage.html';
        return;
    }

    try {
        // Step 1: Fetch submissions for this student, including course info
        const { data: submissions, error: subError } = await supabaseClient
            .from('submission')
            .select(`
                submission_id,
                assignment:assignment_id (
                    course:course_id ( title )
                )
            `)
            .eq('student_id', studentId);

        if (subError) throw subError;

        if (!submissions || submissions.length === 0) {
            resultsBody.innerHTML = '<tr><td colspan="4">No results found (No submissions).</td></tr>';
            return;
        }

        const submissionIds = submissions.map(s => s.submission_id);

        // Step 2: Fetch results matching these submissions
        const { data: resultData, error: resError } = await supabaseClient
            .from('result')
            .select('*')
            .in('submission_id', submissionIds);

        if (resError) throw resError;

        if (resultData && resultData.length > 0) {
            resultsBody.innerHTML = '';
            resultData.forEach(res => {
                // Attach course title from submission map
                const sub = submissions.find(s => s.submission_id === res.submission_id);
                // Safe navigation
                let courseTitle = 'Unknown Course';
                if (sub && sub.assignment && sub.assignment.course) {
                    courseTitle = sub.assignment.course.title;
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${courseTitle}</td>
                    <td>${res.total_marks}</td>
                    <td>${res.obtained_marks}</td>
                    <td class="status-cell"><span class="${(res.status || '').toLowerCase()}">${res.status}</span></td>
                `;
                resultsBody.appendChild(row);
            });
        } else {
            resultsBody.innerHTML = '<tr><td colspan="4">No results found (Pending grading).</td></tr>';
        }

    } catch (err) {
        console.error('Unexpected error:', err);
        resultsBody.innerHTML = '<tr><td colspan="4">Error loading results.</td></tr>';
    }
});
