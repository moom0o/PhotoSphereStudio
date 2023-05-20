function convertDMSToDD([degrees, minutes, seconds]) {
  return degrees + minutes / 60 + seconds / 3600;
}

function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
      $('.image-upload-wrap').hide();

      $('.file-upload-image').attr('src', e.target.result);
      $('.file-upload-content').show();

      $('.image-title').html(input.files[0].name);

      var img = document.createElement('img');
      img.src = e.target.result;

      // Render thumbnail.
      img.onload = function () {
        EXIF.getData(img, function () {
          var allMetaData = EXIF.getAllTags(this);
          var allMetaDataSpan = document.getElementById('allMetaDataSpan');
          //   allMetaDataSpan.innerHTML = JSON.stringify(allMetaData, null, '\t');
          var lat = convertDMSToDD(EXIF.getTag(this, 'GPSLatitude'));
          var long = -convertDMSToDD(EXIF.getTag(this, 'GPSLongitude')); // Negative because it's west longitude
          $('#lat').val(lat);
          $('#long').val(long);
          console.log(`lat: ${lat}, long: ${long}`);
        });
      };
    };

    reader.readAsDataURL(input.files[0]);
  } else {
    removeUpload();
  }
}

function removeUpload() {
  $('.file-upload-input').replaceWith($('.file-upload-input').clone());
  $('.file-upload-content').hide();
  $('.image-upload-wrap').show();
}

$('.image-upload-wrap').bind('dragover', function () {
  $('.image-upload-wrap').addClass('image-dropping');
});

$('.image-upload-wrap').bind('dragleave', function () {
  $('.image-upload-wrap').removeClass('image-dropping');
});
