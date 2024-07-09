document.getElementById("clearButton").addEventListener("click", async () => {
    try {
        const response = await fetch("http://45.84.227.163:2000/clearImages", {
            method: "POST",
        });

        if (response.ok) {
            const images = document.querySelectorAll('img');

            images.forEach(img => {
                img.remove();
            });

            alert("Images successfully cleared!");
        } else {
            alert("Error clearing images");
        }
    } catch (error) {
        console.error("Error clearing images:", error);
    }
});
