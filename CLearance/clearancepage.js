// clearancepage.js - UMD Version
document.addEventListener('DOMContentLoaded', async () => {
    const studentId = sessionStorage.getItem('student_id');

    if (!studentId) {
        window.location.href = '../loginpage.html';
        return;
    }

    try {
        // Fetch fee status for financial clearance
        const { data: feesData, error } = await supabaseClient
            .from('student_fees')
            .select('*')
            .eq('student_id', studentId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is no rows found
            console.error('Error fetching fees:', error);
        }

        const financeStatusEl = document.getElementById('finance-status');
        const financeTotalEl = document.getElementById('finance-total');
        const financeDetailsEl = document.getElementById('finance-details');

        if (feesData) {
            financeTotalEl.textContent = feesData.total_fees;

            if (feesData.status === 'Paid') {
                financeStatusEl.textContent = 'Cleared';
                financeStatusEl.className = 'status cleared'; // css class for green
                financeDetailsEl.textContent = 'All dues paid.';
            } else {
                financeStatusEl.textContent = 'Pending';
                financeStatusEl.className = 'status pending'; // css class for red/orange
                financeDetailsEl.textContent = 'Dues are pending.';
            }
        } else {
            financeStatusEl.textContent = 'Unknown';
            financeStatusEl.className = 'status pending';
            financeDetailsEl.textContent = 'No fee record found.';
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
});
