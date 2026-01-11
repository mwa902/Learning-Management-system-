// feespage.js - UMD Version
document.addEventListener('DOMContentLoaded', async () => {
    const feesBody = document.getElementById('fees-body');
    const studentId = sessionStorage.getItem('student_id');

    if (!studentId) {
        window.location.href = 'loginpage.html';
        return;
    }

    try {
        const { data: feesData, error } = await supabaseClient
            .from('student_fees')
            .select(`
                *,
                student:student_id (name)
            `)
            .eq('student_id', studentId);

        if (error) {
            console.error('Error fetching fees:', error);
            feesBody.innerHTML = '<tr><td colspan="6">Error loading fees.</td></tr>';
            return;
        }

        if (feesData && feesData.length > 0) {
            feesBody.innerHTML = '';
            feesData.forEach(fee => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${fee.student?.name || 'Unknown'}</td>
                    <td>${fee.total_fees}</td>
                    <td>${fee.installment || 0}</td>
                    <td>${fee.fines || 0}</td>
                    <td>${fee.other_charges || 0}</td>
                    <td class="status-cell"><span class="${(fee.status || '').toLowerCase()}">${fee.status}</span></td>
                `;
                feesBody.appendChild(row);
            });
        } else {
            feesBody.innerHTML = '<tr><td colspan="6">No fee records found.</td></tr>';
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
});
