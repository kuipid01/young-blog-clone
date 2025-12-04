
// Simple side effect mock
export const sendMailToAdmin = async (order: any) => {
    console.log(`[Email Sent] Admin notified of new order: ${order.id}`);
    // In a real app, you would use a library like nodemailer here.
};