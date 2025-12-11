// utils/copyOrderSlip.js
export async function copyOrderSlip(orderID) {
    try {
        // Call API
        const res = await fetch(`/api/slip-info?orderID=${orderID}`);
        if (!res.ok) {
            throw new Error(`Failed to fetch order: ${res.statusText}`);
        }

        const data = await res.json();

        // Format the response as text
        let text = `Order No: ${data.orderID}\n`;

        text += `Products:\n`;
        data.cart.forEach((item, i) => {
            text += `${i + 1}. ${item.name}\n`;
            text += `   Variant: ${item.variant.name} ${item.selectedSize ? `, Size: ${item.selectedSize}` : ""},Quantity: ${item.quantity}\n`;

            // text += `   Quantity: ${item.quantity}\n`;
            // text += `   Price: ${item.price * item.quantity}\n`;
        });

        text += `Total Due: ${data.total}\n`;
        text += `Order Confirmed ✅\n`;

        // ✅ Clipboard must be called in response to a user action
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for insecure context (e.g. localhost http)
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
        }

        return { success: true, message: "Order slip copied to clipboard!" };
    } catch (err) {
        console.error("Error copying order slip:", err);
        return { success: false, message: err.message };
    }
}
