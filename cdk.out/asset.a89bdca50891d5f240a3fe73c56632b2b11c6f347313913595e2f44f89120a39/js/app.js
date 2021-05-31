const API_ENDPOINT = 'https://o2inhgks1i.execute-api.ap-southeast-2.amazonaws.com/prod/';
const DEBUG = false;

const listPhotos = async () => {
  const response = await fetch(`${API_ENDPOINT}/photo`, {
    method: "GET"
  });
  return await response.json();
}

const renderPhotos = async () => {
  const photoList = document.createElement('div');
  photoList.setAttribute('id', 'photo-list')
  
  const photos = await listPhotos();
  photos.map(photo => {
    const photoImage = document.createElement('img');
    photoImage.setAttribute('src', `/${photo.key}`);
    photoImage.setAttribute('alt', photo.key);
    photoImage.setAttribute('id', `photo-${photo.id}`);

    const photoWrap = document.createElement('figure');
    photoWrap.appendChild(photoImage)

    photoList.appendChild(photoWrap);
  })

  for (const photo in await listPhotos()) {
  }

  document.querySelector('div#app').appendChild(photoList);
}

const toBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

const uploadPhoto = async () => {
  const formData = new FormData();
  const file = document.querySelector('#file-upload').files[0];

  DEBUG && console.log(file);

  const fileAsBase64 = await toBase64(file);
  formData.append('file', file.value);

  fetch(`${API_ENDPOINT}/photo`, {
    method: 'POST',
    body: JSON.stringify({
      fileAsBase64: fileAsBase64,
      name: file.name,
      type: file.type,
    })
  })
  .then(response => response.json())
  .then(data => {
    console.info('successfully uploading file');
    DEBUG && console.log(data);
  })
  .catch(error => {
    console.error('error uploading file');
    DEBUG && console.error(error);
  })
}

const uploadPhotoUi = () => {
  const fileUploadInput = document.createElement('input');
  fileUploadInput.setAttribute('id', 'file-upload');
  fileUploadInput.setAttribute('type', 'file');
  fileUploadInput.setAttribute('accept', '.png,.jpg,.jpeg');

  const uploadButton = document.createElement('button');
  uploadButton.setAttribute('id', 'upload');
  uploadButton.setAttribute('type', 'button');
  uploadButton.innerHTML = 'Upload';
  uploadButton.addEventListener('click', uploadPhoto);

  const uploadForm = document.createElement('form');
  uploadForm.setAttribute('id', 'upload-form');
  uploadForm.appendChild(fileUploadInput);
  uploadForm.appendChild(uploadButton);
  document.querySelector('div#app').appendChild(uploadForm);
}

(function() {
  console.log('loading app ...');

  uploadPhotoUi();

  console.log('app loading complete');
})();
