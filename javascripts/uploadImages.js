document.getElementById('uploadButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');

    if (fileInput.files.length === 0) {
        alert('Please select a file');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function () {
        const imageData = reader.result;

        try {
            const {width, height} = await getImageResolution(imageData);

            if (width === 1920 && height === 1080) {
                const imageDataJpeg = await convertToJpeg(imageData);

                await uploadImage(imageDataJpeg);
            } else {
                document.getElementById('status').innerText = 'Incorrect file resolution';
            }
        } catch (error) {
            console.error(error);
        }

        fileInput.value = null;
    }

    reader.readAsDataURL(file);
});

async function convertToJpeg(imageData) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function () {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg'));
        };

        img.onerror = function () {
            reject(new Error('Error loading image'));
        };

        img.src = imageData;
    });
}

async function uploadImage(imageDataJpeg) {
    fetch('http://45.84.227.163:2000/upload', {
        method: 'POST',
        body: JSON.stringify(imageDataJpeg),
    })
        .then(response => response.text())
        .then(result => {
            document.getElementById('status').textContent = result;
            getImages();
        })
        .catch(error => console.error(error));
}

function getImageResolution(base64String) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.src = base64String;
        img.onload = function () {
            resolve({width: img.width, height: img.height});
        };
        img.onerror = function () {
            reject('Error loading image');
        };
    });
}

function getImages() {
    fetch('http://45.84.227.163:2000/images')
        .then(response => response.json())
        .then(data => {
            const imagesContainer = document.getElementById('images-container');

            imagesContainer.innerHTML = '';

            data.slice(-3)
                .filter(image => image.content)
                .forEach(file => {
                    const imageElement = document.createElement('img');

                    imageElement.src = file.content.slice(1, -1);
                    imagesContainer.appendChild(imageElement);
                    setStyleForImage(imagesContainer);
                });

            const firstImage = document.querySelector('img');

            if (firstImage) {
                firstImage.classList.add('is-visible')
            }
        })
        .catch(error => console.error('Error fetching images:', error));
}

function initGettingImages() {
    const images = document.getElementsByTagName('img');

    if (!images.length) {
        getImages();
    }
}

function setStyleForImage(imagesContainer) {
    const allImages = Array.from(imagesContainer.querySelectorAll('img'));
    const lastThreeImages = allImages.slice(-3);

    lastThreeImages.forEach((image) => {
        image.style.height = '200px';
        image.style.margin = '20px';
    });
}

initGettingImages();
