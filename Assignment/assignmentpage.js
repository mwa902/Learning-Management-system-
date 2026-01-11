// assignmentpage.js - UMD Version
document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('assignments-list');
    const studentId = sessionStorage.getItem('student_id');

    if (!studentId) {
        window.location.href = '../loginpage.html';
        return;
    }

    try {
        // Step 1: Fetch all assignments with course details
        const { data: assignments, error: assignError } = await supabaseClient
            .from('assignment')
            .select(`
                *,
                course:course_id (title, course_code)
            `);

        if (assignError) throw assignError;

        // Step 2: Fetch submissions for this student to check status
        const { data: submissions, error: subError } = await supabaseClient
            .from('submission')
            .select('assignment_id, status')
            .eq('student_id', studentId);

        if (subError) throw subError;

        if (assignments && assignments.length > 0) {
            listContainer.innerHTML = '';
            const processedCourseIds = new Set();
            assignments.forEach(assign => {
                const courseId = assign.course_id;
                // Skip if we've already displayed an assignment for this course
                if (processedCourseIds.has(courseId)) return;
                processedCourseIds.add(courseId);
                // Check if submitted
                const sub = submissions.find(s => s.assignment_id === assign.assignment_id);
                // If submitted, show timestamp if available
                let submissionStatus = 'Not Submitted';
                if (sub) {
                    submissionStatus = 'Submitted';
                    if (sub.sub_date) submissionStatus += ` on ${sub.sub_date}`;
                    if (sub.sub_time) submissionStatus += ` at ${sub.sub_time}`;
                }

                const isSubmitted = !!sub;

                const card = document.createElement('div');
                card.className = 'assignment-card';

                // Logic for button
                let buttonHtml = '';
                if (assign.status === 'Closed') {
                    buttonHtml = `<button class="submit-btn closed" disabled>Closed</button>`;
                } else if (isSubmitted) {
                    buttonHtml = `<button class="submit-btn submitted" disabled>Submitted</button>`;
                } else {
                    // Button redirects to submission page
                    buttonHtml = `<button class="submit-btn" onclick="window.location.href='../Submission/submission.html?assignmentId=${assign.assignment_id}'">Submit Assignment</button>`;
                }

                card.innerHTML = `
                    <h3>${assign.course?.title || 'Unknown Course'} (${assign.course?.course_code || ''})</h3>
                    <p><strong>Due Date:</strong> <span>${assign.due_date}</span></p>
                    <p><strong>Due Time:</strong> <span>${assign.due_time}</span></p>
                    <p><strong>Status:</strong> <span>${assign.status}</span></p>
                    ${buttonHtml}
                `;
                listContainer.appendChild(card);
            });
        } else {
            listContainer.innerHTML = '<p>No assignments found.</p>';
        }

    } catch (err) {
        console.error('Unexpected error:', err);
        listContainer.innerHTML = '<p>Error loading assignments.</p>';
    }
});
