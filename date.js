function dateDifference(start, end) {
    let startDate = new Date(start);
    let endDate = new Date(end);

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();

    // Adjust if end day is smaller than start day
    if (days < 0) {
        months -= 1; // Borrow from months
        let prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0).getDate();
        days += prevMonth;
    }

    // Adjust if end month is smaller than start month
    if (months < 0) {
        years -= 1; // Borrow from years
        months += 12;
    }
    // Store values in an object
    let date_diff = {
        years: years,
        months: months,
        days: days,
        formatted: `${years} Years, ${months} Months, ${days} Days`
    };

    return date_diff;
}
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
console.log(formattedDate);
// Example Usage:
const date_diff = dateDifference("2025-03-29T09:24:26.008Z", "2025-09-26");
console.log("Years:", date_diff.years);
console.log("Months:", date_diff.months);
console.log("Days:", date_diff.days);
console.log("Formatted:", date_diff.formatted);
