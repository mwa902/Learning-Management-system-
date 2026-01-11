// admin_dashboard.js
document.addEventListener('DOMContentLoaded', async () => {
    // Basic Auth Check
    const role = sessionStorage.getItem('user_role');
    if (role !== 'Admin') {
        // alert('Access Denied. Admins only.');
        // window.location.href = 'hubpage.html';
        // Commented out for smoother testing flow, or uncomment for security
    }

    // --- RESULTS MANAGEMENT ---
    const resultsTableBody = document.querySelector('#results-table tbody');

    async function loadResults() {
        resultsTableBody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';

        // Join queries are tricky in Supabase clients without foreign key aliases manually checked
        // We will fetch and join manually or use the robust select syntax if keys allow
        const { data: results, error } = await supabaseClient
            .from('result')
            .select(`
                *,
                submission:submission_id (
                    student:student_id (name, student_id),
                    assignment:assignment_id (
                        course:course_id (title, course_code)
                    )
                )
            `);

        if (error) {
            console.error('Error loading results:', error);
            resultsTableBody.innerHTML = '<tr><td colspan="7">Error loading results</td></tr>';
            return;
        }

        renderResults(results);
    }

    function renderResults(results) {
        resultsTableBody.innerHTML = '';
        if (!results || results.length === 0) {
            resultsTableBody.innerHTML = '<tr><td colspan="7">No results found</td></tr>';
            return;
        }

        results.forEach(res => {
            const studentName = res.submission?.student?.name || 'Unknown';
            const courseCode = res.submission?.assignment?.course?.course_code || 'N/A';
            const courseTitle = res.submission?.assignment?.course?.title || '';
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${res.result_id}</td>
                <td>${studentName}</td>
                <td>${courseCode} - ${courseTitle}</td>
                <td><span class="display-val">${res.total_marks}</span><input type="number" class="edit-input" style="display:none" value="${res.total_marks}"></td>
                <td><span class="display-val">${res.obtained_marks}</span><input type="number" class="edit-input" style="display:none" value="${res.obtained_marks}"></td>
                <td>
                    <span class="display-val">${res.status}</span>
                    <select class="status-select edit-input" style="display:none">
                        <option value="Pass" ${res.status === 'Pass' ? 'selected' : ''}>Pass</option>
                        <option value="Fail" ${res.status === 'Fail' ? 'selected' : ''}>Fail</option>
                    </select>
                </td>
                <td>
                    <button class="btn btn-edit" onclick="toggleEditResult(this)">Edit</button>
                    <button class="btn btn-save" style="display:none" onclick="saveResult(this, ${res.result_id})">Save</button>
                    <button class="btn btn-delete" onclick="deleteResult(${res.result_id})">Delete</button>
                </td>
            `;
            resultsTableBody.appendChild(tr);
        });
    }

    window.toggleEditResult = (btn) => {
        const row = btn.closest('tr');
        const spans = row.querySelectorAll('.display-val');
        const inputs = row.querySelectorAll('.edit-input');

        spans.forEach((span, index) => {
            if (inputs[index] && inputs[index].tagName === 'INPUT') {
                inputs[index].value = span.textContent.trim(); // Sync value explicitly
            }
            span.style.display = 'none';
        });

        inputs.forEach(el => el.style.display = 'inline-block');
        btn.style.display = 'none';
        row.querySelector('.btn-save').style.display = 'inline-block';
    };

    window.saveResult = async (btn, resultId) => {
        const row = btn.closest('tr');
        const inputs = row.querySelectorAll('.edit-input');
        const newTotal = inputs[0].value;
        const newObtained = inputs[1].value;
        const newStatus = row.querySelector('.status-select').value;

        // Optimistic UI update or simple reload
        try {
            const { error } = await supabaseClient
                .from('result')
                .update({
                    total_marks: newTotal,
                    obtained_marks: newObtained,
                    status: newStatus
                })
                .eq('result_id', resultId);

            if (error) throw error;
            alert('Result updated!');
            loadResults(); // Reload to refresh status trigger logic
        } catch (err) {
            console.error(err);
            alert('Error updating result: ' + err.message);
        }
    };

    window.deleteResult = async (resultId) => {
        if (!confirm('Are you sure you want to delete this result?')) return;
        try {
            const { error } = await supabaseClient
                .from('result')
                .delete()
                .eq('result_id', resultId);

            if (error) throw error;
            alert('Result deleted!');
            loadResults();
        } catch (err) {
            console.error(err);
            alert('Error deleting result: ' + err.message);
        }
    };


    // --- FEES MANAGEMENT ---
    const feesTableBody = document.querySelector('#fees-table tbody');

    async function loadFees() {
        feesTableBody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';

        const { data: fees, error } = await supabaseClient
            .from('student_fees')
            .select(`
                *,
                student:student_id (name, student_id)
            `);

        if (error) {
            console.error('Error loading fees:', error);
            feesTableBody.innerHTML = '<tr><td colspan="7">Error loading fees</td></tr>';
            return;
        }

        renderFees(fees);
    }

    function renderFees(feesList) {
        feesTableBody.innerHTML = '';
        if (!feesList || feesList.length === 0) {
            feesTableBody.innerHTML = '<tr><td colspan="7">No fees records found</td></tr>';
            return;
        }

        feesList.forEach(fee => {
            const studentName = fee.student?.name || 'Unknown';
            const row = document.createElement('tr');

            row.innerHTML = `
                <td>${fee.fees_id}</td>
                <td>${studentName}</td>
                <td>
                    <select class="status-select" disabled>
                        <option value="Paid" ${fee.status === 'Paid' ? 'selected' : ''}>Paid</option>
                        <option value="Pending" ${fee.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    </select>
                </td>
                <td><span class="display-val">${fee.total_fees}</span><input type="number" class="edit-input" style="display:none" value="${fee.total_fees}"></td>
                <td><span class="display-val">${fee.fines}</span><input type="number" class="edit-input" style="display:none" value="${fee.fines}"></td>
                <td><span class="display-val">${fee.installment}</span><input type="number" class="edit-input" style="display:none" value="${fee.installment}"></td>
                <td>
                    <button class="btn btn-edit" onclick="toggleEditFees(this)">Edit</button>
                    <button class="btn btn-save" style="display:none" onclick="saveFees(this, ${fee.fees_id})">Save</button>
                    <button class="btn btn-delete" onclick="clearFees(this, ${fee.fees_id})" style="background-color:orange">Clear</button>
                    <button class="btn btn-delete" onclick="deleteFeeRecord(${fee.fees_id})">Delete</button>
                </td>
            `;
            feesTableBody.appendChild(row);
        });
    }

    window.toggleEditFees = (btn) => {
        const row = btn.closest('tr');
        const spans = row.querySelectorAll('.display-val');
        const inputs = row.querySelectorAll('.edit-input');

        spans.forEach((span, index) => {
            if (inputs[index]) {
                inputs[index].value = span.textContent.trim(); // Sync value
            }
            span.style.display = 'none';
        });

        inputs.forEach(el => el.style.display = 'inline-block');
        const sel = row.querySelector('.status-select');
        sel.disabled = false;

        btn.style.display = 'none';
        row.querySelector('.btn-save').style.display = 'inline-block';
    };

    window.saveFees = async (btn, feeId) => {
        const row = btn.closest('tr');
        const inputs = row.querySelectorAll('.edit-input');
        const total = inputs[0].value;
        const fines = inputs[1].value;
        const installment = inputs[2].value;
        const status = row.querySelector('.status-select').value;

        try {
            const { error } = await supabaseClient
                .from('student_fees')
                .update({
                    total_fees: total,
                    fines: fines,
                    installment: installment,
                    status: status
                })
                .eq('fees_id', feeId);

            if (error) throw error;
            alert('Fees updated!');
            loadFees();
        } catch (err) {
            console.error(err);
            alert('Error updating fees: ' + err.message);
        }
    };

    // "Clear Fees" logic - e.g. set status to Paid, remove fines?
    window.clearFees = async (btn, feeId) => {
        if (!confirm('Clear this fee record (Set to Paid, 0 Fines)?')) return;
        try {
            const { error } = await supabaseClient
                .from('student_fees')
                .update({
                    status: 'Paid',
                    fines: 0,
                    other_charges: 0
                })
                .eq('fees_id', feeId);

            if (error) throw error;
            alert('Fees cleared!');
            loadFees();
        } catch (err) {
            console.error(err);
            alert('Error clearing fees: ' + err.message);
        }
    }

    window.deleteFeeRecord = async (feeId) => {
        if (!confirm('Delete this ENTIRE fee record?')) return;
        try {
            const { error } = await supabaseClient
                .from('student_fees')
                .delete()
                .eq('fees_id', feeId);
            if (error) throw error;
            alert('Record deleted');
            loadFees();
        } catch (err) {
            console.error(err);
            alert('Error deleting: ' + err.message);
        }
    }

    // --- UI NAVIGATION ---
    window.showSection = (sectionName) => {
        // Hide all sections
        document.querySelectorAll('.section').forEach(el => el.style.display = 'none');
        // Show target
        const target = document.getElementById(sectionName + '-section');
        if (target) {
            target.style.display = 'block';
        }
    };

    // --- PROFILES MANAGEMENT ---
    const profilesTableBody = document.querySelector('#profiles-table tbody');

    async function loadProfiles() {
        profilesTableBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';

        const { data: students, error } = await supabaseClient
            .from('student')
            .select('*')
            .order('student_id', { ascending: true });

        if (error) {
            console.error('Error loading profiles:', error);
            profilesTableBody.innerHTML = '<tr><td colspan="6">Error loading data</td></tr>';
            return;
        }

        renderProfiles(students);
    }

    function renderProfiles(list) {
        profilesTableBody.innerHTML = '';
        if (!list || list.length === 0) {
            profilesTableBody.innerHTML = '<tr><td colspan="7">No students found</td></tr>';
            return;
        }

        list.forEach(std => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${std.student_id}</td>
                <td><span class="display-val">${std.name}</span><input type="text" class="edit-input" style="display:none; width:120px" value="${std.name}"></td>
                <td><span class="display-val">${std.program || ''}</span><input type="text" class="edit-input" style="display:none; width:60px" value="${std.program || ''}"></td>
                <td><span class="display-val">${std.batch || ''}</span><input type="number" class="edit-input" style="display:none; width:60px" value="${std.batch || ''}"></td>
                <td><span class="display-val">${std.phone_no || ''}</span><input type="text" class="edit-input" style="display:none; width:100px" value="${std.phone_no || ''}"></td>
                <td><span class="display-val">${std.email || ''}</span><input type="email" class="edit-input" style="display:none; width:150px" value="${std.email || ''}"></td>
                <td>
                    <button class="btn btn-edit" onclick="toggleEditProfile(this)">Edit</button>
                    <button class="btn btn-save" style="display:none" onclick="saveProfile(this, ${std.student_id})">Save</button>
                    <button class="btn btn-delete" onclick="deleteProfile(${std.student_id})">Delete</button>
                </td>
            `;
            profilesTableBody.appendChild(tr);
        });
    }

    window.toggleEditProfile = (btn) => {
        const row = btn.closest('tr');
        const spans = row.querySelectorAll('.display-val');
        const inputs = row.querySelectorAll('.edit-input');

        spans.forEach((span, index) => {
            if (inputs[index]) inputs[index].value = span.textContent.trim();
            span.style.display = 'none';
        });

        inputs.forEach(el => el.style.display = 'inline-block');
        btn.style.display = 'none';
        row.querySelector('.btn-save').style.display = 'inline-block';
    }

    window.saveProfile = async (btn, studentId) => {
        const row = btn.closest('tr');
        const inputs = row.querySelectorAll('.edit-input');

        const name = inputs[0].value;
        const program = inputs[1].value;
        const batch = inputs[2].value;
        const phone = inputs[3].value;
        const email = inputs[4].value;

        try {
            const { error } = await supabaseClient
                .from('student')
                .update({
                    name: name,
                    program: program,
                    batch: batch,
                    phone_no: phone,
                    email: email
                })
                .eq('student_id', studentId);

            if (error) throw error;
            alert('Profile updated!');
            loadProfiles();
        } catch (err) {
            console.error(err);
            alert('Error updating profile: ' + err.message);
        }
    }

    window.deleteProfile = async (studentId) => {
        if (!confirm('Are you sure you want to delete this student profile? This may delete all related data (results, fees, auth).')) return;

        try {
            const { error } = await supabaseClient
                .from('student')
                .delete()
                .eq('student_id', studentId);

            if (error) throw error;
            alert('Student Profile Deleted Successfully!');
            loadProfiles();
        } catch (err) {
            console.error(err);
            alert('Error deleting profile: ' + err.message);
        }
    }

    // --- NEW: ADD RESULT & ADD FEES LOGIC ---

    // Modal Helpers
    window.openAddResultForm = () => {
        document.getElementById('addResultModal').style.display = 'block';
        loadResultDropdowns();

        // Auto-calculate status as they type
        const obtainedInput = document.getElementById('res-obtained-marks');
        const totalInput = document.getElementById('res-total-marks');
        const statusSelect = document.getElementById('res-status');

        const updateStatus = () => {
            const marks = parseFloat(obtainedInput.value);
            const total = parseFloat(totalInput.value);
            if (!isNaN(marks) && !isNaN(total)) {
                statusSelect.value = (marks / total >= 0.5) ? 'Pass' : 'Fail';
            }
        };

        obtainedInput.addEventListener('input', updateStatus);
        totalInput.addEventListener('input', updateStatus);
    };
    window.closeAddResultForm = () => document.getElementById('addResultModal').style.display = 'none';

    window.openAddFeesForm = () => {
        document.getElementById('addFeesModal').style.display = 'block';
        loadFeeDropdowns();
    };
    window.closeAddFeesForm = () => document.getElementById('addFeesModal').style.display = 'none';

    // Dropdown Loaders
    async function loadResultDropdowns() {
        const studentSelect = document.getElementById('res-student-id');
        const assignSelect = document.getElementById('res-assignment-id');

        // Load Students
        const { data: students } = await supabaseClient.from('student').select('student_id, name').order('name');
        if (students) {
            studentSelect.innerHTML = students.map(s => `<option value="${s.student_id}">${s.name} (${s.student_id})</option>`).join('');
        }

        // Load Assignments
        const { data: assignments } = await supabaseClient.from('assignment').select('assignment_id, course:course_id(title)');
        if (assignments) {
            // Deduplicate by course title to show unique subjects
            const uniqueSubjects = new Map();
            assignments.forEach(a => {
                const title = a.course?.title || 'Assignment ' + a.assignment_id;
                if (!uniqueSubjects.has(title)) {
                    uniqueSubjects.set(title, a.assignment_id);
                }
            });

            assignSelect.innerHTML = Array.from(uniqueSubjects.entries())
                .map(([title, id]) => `<option value="${id}">${title}</option>`)
                .join('');
        }
    }

    async function loadFeeDropdowns() {
        const studentSelect = document.getElementById('fee-student-id');
        const { data: students } = await supabaseClient.from('student').select('student_id, name').order('name');
        if (students) {
            studentSelect.innerHTML = students.map(s => `<option value="${s.student_id}">${s.name} (${s.student_id})</option>`).join('');
        }
    }

    // Form Submissions
    document.getElementById('addResultForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('res-student-id').value;
        const assignmentId = document.getElementById('res-assignment-id').value;
        const totalMarks = parseFloat(document.getElementById('res-total-marks').value);
        const obtainedMarks = parseFloat(document.getElementById('res-obtained-marks').value);
        const status = document.getElementById('res-status').value;
        const submitBtn = document.getElementById('btn-submit-result');

        if (isNaN(obtainedMarks)) {
            alert('Please enter valid obtained marks.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating...';

        try {
            // 1. Check if a submission exists for this student/assignment
            let { data: sub, error: subError } = await supabaseClient
                .from('submission')
                .select('submission_id')
                .eq('student_id', studentId)
                .eq('assignment_id', assignmentId)
                .single();

            let submissionId;
            if (subError || !sub) {
                // Create a dummy submission if none exists
                const newId = Math.floor(Math.random() * 100000) + 1000;
                const { error: insertError } = await supabaseClient
                    .from('submission')
                    .insert([{
                        submission_id: newId,
                        student_id: studentId,
                        assignment_id: assignmentId,
                        sub_date: new Date().toISOString().split('T')[0],
                        sub_time: new Date().toTimeString().split(' ')[0],
                        status: 'Submitted',
                        graded: true
                    }]);
                if (insertError) throw insertError;
                submissionId = newId;
            } else {
                submissionId = sub.submission_id;
            }

            // 2. Create the Result
            const { error: resError } = await supabaseClient
                .from('result')
                .insert([{
                    result_id: Math.floor(Math.random() * 100000) + 1000,
                    submission_id: submissionId,
                    total_marks: totalMarks,
                    obtained_marks: obtainedMarks,
                    status: status
                }]);

            if (resError) throw resError;

            alert('Result added successfully!');
            closeAddResultForm();
            loadResults();
        } catch (err) {
            console.error(err);
            alert('Error creating result: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Create Result';
        }
    });

    document.getElementById('addFeesForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('fee-student-id').value;
        const total = document.getElementById('fee-total').value;
        const fines = document.getElementById('fee-fines').value;
        const installment = document.getElementById('fee-installment').value;
        const status = document.getElementById('fee-status').value;
        const submitBtn = document.getElementById('btn-submit-fee');

        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating...';

        try {
            const { error } = await supabaseClient
                .from('student_fees')
                .insert([{
                    fees_id: Math.floor(Math.random() * 100000) + 1000,
                    student_id: studentId,
                    total_fees: total,
                    fines: fines,
                    installment: installment,
                    status: status
                }]);

            if (error) throw error;

            alert('Fee record added successfully!');
            closeAddFeesForm();
            loadFees();
        } catch (err) {
            console.error(err);
            alert('Error creating fee record: ' + err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Create Fee Record';
        }
    });

    // Initial Load
    loadResults();
    loadFees();
    loadProfiles();
});
