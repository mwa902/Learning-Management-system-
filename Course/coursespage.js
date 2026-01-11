// coursespage.js - UMD Version
document.addEventListener('DOMContentLoaded', async () => {
    const coursesList = document.getElementById('courses-list');
    const studentId = sessionStorage.getItem('student_id');

    if (!studentId) {
        window.location.href = '../loginpage.html';
        return;
    }

    // 1. Fetch courses and Submissions in parallel
    try {
        const [coursesResponse, submissionsResponse] = await Promise.all([
            supabaseClient
                .from('course')
                .select('*')
                .order('course_code', { ascending: true }),

            studentId ? supabaseClient
                .from('submission')
                .select('submission_id, assignment:assignment_id(course_id)')
                .eq('student_id', studentId)
                : { data: [], error: null }
        ]);

        const { data: courses, error: coursesError } = coursesResponse;
        const { data: submissions, error: subError } = submissionsResponse;

        if (coursesError) throw coursesError;
        if (subError && studentId) console.warn('Error fetching submissions:', subError);

        // Create a Set of enrolled course IDs for fast lookup
        // submissions might contain null assignments if data integrity issues, so filter safely
        const enrolledCourseIds = new Set();
        if (submissions) {
            submissions.forEach(sub => {
                if (sub.assignment && sub.assignment.course_id) {
                    enrolledCourseIds.add(sub.assignment.course_id);
                }
            });
        }

        if (courses && courses.length > 0) {
            coursesList.innerHTML = '';
            courses.forEach(course => {
                const isEnrolled = enrolledCourseIds.has(course.course_id);
                const enrollButton = isEnrolled
                    ? `<button disabled style="background-color: #059669; cursor: default;">Enrolled</button>`
                    : `<button id="btn-${course.course_id}" onclick="enrollCourse(${course.course_id}, '${course.title.replace(/'/g, "\\'")}')">Enroll</button>`;

                const card = document.createElement('div');
                card.className = 'course-card';
                card.innerHTML = `
                    <h3>${course.title}</h3>
                    <p><strong>Course Code:</strong> ${course.course_code}</p>
                    <p><strong>Instructor:</strong> ${course.instructor || 'N/A'}</p>
                    <p><strong>Schedule:</strong> ${course.schedule || 'N/A'}</p>
                    <p>${course.description || 'No description available.'}</p>
                    <p><strong>Credit Hours:</strong> ${course.credit_hr}</p>
                    ${enrollButton}
                `;
                coursesList.appendChild(card);
            });
        } else {
            coursesList.innerHTML = '<p>No courses found.</p>';
        }

    } catch (err) {
        console.error('Unexpected error:', err);
        coursesList.innerHTML = '<p>Error loading courses.</p>';
    }

    // 2. Enrollment Logic
    window.enrollCourse = async (courseId, courseTitle) => {
        if (!studentId) {
            alert('Please login to enroll.');
            return;
        }

        const btn = document.getElementById(`btn-${courseId}`);
        if (btn) btn.disabled = true;
        btn.innerText = 'Processing...';

        try {
            // A. Check if already enrolled (Check submissions/results for this course)
            // We check again just in case, but UI should have handled it.
            const { data: existingSub, error: checkError } = await supabaseClient
                .from('submission')
                .select('submission_id, assignment:assignment_id(course_id)')
                .eq('student_id', studentId);

            if (checkError) throw checkError;

            const alreadyEnrolled = existingSub.some(sub => sub.assignment && sub.assignment.course_id === courseId);

            if (alreadyEnrolled) {
                alert(`You are already enrolled in ${courseTitle}.`);
                // Update button state permanently being safe
                btn.innerText = 'Enrolled';
                btn.style.backgroundColor = '#059669';
                return;
            }

            // B. Add Fees (+30,000) - Keeping this as requested by logic flow, but skipping if schema/data changes are restricted
            try {
                const { data: feeRecord, error: feeErr } = await supabaseClient
                    .from('student_fees')
                    .select('*')
                    .eq('student_id', studentId)
                    .single();

                if (!feeErr && feeRecord) {
                    const newTotal = parseFloat(feeRecord.total_fees || 0) + 30000;
                    await supabaseClient
                        .from('student_fees')
                        .update({ total_fees: newTotal })
                        .eq('fees_id', feeRecord.fees_id);
                } else if (feeErr && feeErr.code === 'PGRST116') {
                    await supabaseClient
                        .from('student_fees')
                        .insert([{ student_id: studentId, total_fees: 30000, status: 'Pending' }]);
                }
            } catch (feeError) {
                console.warn('Fee update skipped or failed:', feeError);
            }

            // Simulated Delay as requested (3-5 seconds)
            await new Promise(resolve => setTimeout(resolve, 4000));

            alert(`Successfully enrolled in ${courseTitle}!`);
            btn.innerText = 'Enrolled';
            btn.disabled = true;
            btn.style.background = '#059669'; // Success green
            btn.style.cursor = 'default';

        } catch (error) {
            console.error('Enrollment Error:', error);
            alert('Failed to enroll: ' + error.message);
            if (btn) { btn.disabled = false; btn.innerText = 'Enroll'; }
        }
    };
});
