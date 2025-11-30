// static/js/dashboard.js
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();

    async function loadDashboardData() {
        try {
            const response = await fetch('/api/dashboard-data/');
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                const data = result.data;
                updateStatistics(data.counts);
                updateRecentActivity(data.recent_activity);
                updateMonthlyTrends(data.monthly_trends);
                updateTopCustomers(data.top_customers);
            } else {
                throw new Error(result.message || 'Failed to load dashboard data');
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showErrorState();
        }
    }

    function updateStatistics(counts) {
        document.getElementById('totalBills').textContent = counts.total_bills;
        document.getElementById('totalDrafts').textContent = counts.drafts;
        document.getElementById('totalKachaBills').textContent = counts.kacha_bills;
        document.getElementById('totalPakkaBills').textContent = counts.pakka_bills;
    }

    function updateRecentActivity(activity) {
        const container = document.getElementById('recentActivity');
        
        // Combine all recent activities
        const allActivities = [
            ...activity.drafts.map(item => ({...item, type: 'draft'})),
            ...activity.kacha_bills.map(item => ({...item, type: 'kacha'})),
            ...activity.pakka_bills.map(item => ({...item, type: 'pakka'}))
        ].sort((a, b) => new Date(b.billDate || b._id.generation_time) - new Date(a.billDate || a._id.generation_time))
         .slice(0, 5);

        if (allActivities.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p>No recent activity found.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = allActivities.map(item => `
            <div class="flex items-center justify-between p-3 border border-mystic rounded-lg hover:border-neon transition-colors">
                <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 rounded-full ${
                        item.type === 'draft' ? 'bg-electric' : 
                        item.type === 'kacha' ? 'bg-yellow-500' : 'bg-green-500'
                    }"></div>
                    <div>
                        <h4 class="font-medium text-white text-sm">${escapeHtml(item.firmName || 'Unknown Firm')}</h4>
                        <p class="text-xs text-gray-400">${escapeHtml(item.customerName || 'Unknown Customer')}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="inline-block px-2 py-1 text-xs rounded ${
                        item.type === 'draft' ? 'bg-electric/20 text-electric' : 
                        item.type === 'kacha' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
                    }">
                        ${item.type === 'draft' ? 'Draft' : item.type === 'kacha' ? 'Kacha' : 'Pakka'}
                    </span>
                    <p class="text-sm text-neon mt-1">₹${(item.totalAmount || 0).toFixed(2)}</p>
                </div>
            </div>
        `).join('');
    }

    function updateMonthlyTrends(trends) {
        const container = document.getElementById('monthlyTrends');
        
        if (trends.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p>No trend data available.</p>
                </div>
            `;
            return;
        }

        const maxTotal = Math.max(...trends.map(t => t.total));
        
        container.innerHTML = trends.map(trend => {
            const kachaPercent = maxTotal > 0 ? (trend.kacha_bills / maxTotal) * 100 : 0;
            const pakkaPercent = maxTotal > 0 ? (trend.pakka_bills / maxTotal) * 100 : 0;
            
            return `
                <div class="mb-4 last:mb-0">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-medium text-gray-300">${trend.month}</span>
                        <span class="text-sm text-neon">${trend.total} bills</span>
                    </div>
                    <div class="flex h-4 bg-mystic rounded-full overflow-hidden">
                        <div class="bg-yellow-500" style="width: ${kachaPercent}%"></div>
                        <div class="bg-green-500" style="width: ${pakkaPercent}%"></div>
                    </div>
                    <div class="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Kacha: ${trend.kacha_bills}</span>
                        <span>Pakka: ${trend.pakka_bills}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function updateTopCustomers(customers) {
        const container = document.getElementById('topCustomers');
        
        if (customers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p>No customer data available.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = customers.map((customer, index) => `
            <div class="flex items-center justify-between p-3 border border-mystic rounded-lg mb-3 last:mb-0 hover:border-neon transition-colors">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-r from-neon to-electric flex items-center justify-center text-white text-sm font-bold">
                        ${index + 1}
                    </div>
                    <div>
                        <h4 class="font-medium text-white text-sm">${escapeHtml(customer.name)}</h4>
                        <p class="text-xs text-gray-400">${customer.count} bill${customer.count !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xs text-gray-400">Top Customer</span>
                </div>
            </div>
        `).join('');
    }

    function showErrorState() {
        const containers = ['recentActivity', 'monthlyTrends', 'topCustomers'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-4 text-red-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto mb-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                        <p>Failed to load data</p>
                    </div>
                `;
            }
        });
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});