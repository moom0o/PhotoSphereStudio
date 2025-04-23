function convertDMSToDD([degrees, minutes, seconds], ref) {
    decimal_degrees = degrees + minutes / 60 + seconds / 3600;
    if (ref == 'S' || ref == 'W') {
        decimal_degrees = -decimal_degrees;
    }
    return decimal_degrees;
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
                ExifReader.load(input.files[0], {async: false}).then(function (tags) {
                    if(tags["PoseHeadingDegrees"]){
                        $('#pose').val(tags["PoseHeadingDegrees"].value);
                    } else {
                        $('#pose').val(0);
                    }

                }).catch(function (error) {
                    $('#pose').val(0);
                    console.log(error)
                })
                EXIF.getData(img, function () {
                    var lat = convertDMSToDD(
                        EXIF.getTag(this, 'GPSLatitude'),
                        EXIF.getTag(this, 'GPSLatitudeRef')
                    );
                    var long = convertDMSToDD(
                        EXIF.getTag(this, 'GPSLongitude'),
                        EXIF.getTag(this, 'GPSLongitudeRef')
                    );
                    $('#lat').val(lat);
                    $('#long').val(long);
                    map.setView([lat, long], 18);
                    marker = L.marker([lat, long]).addTo(map);
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
    if (marker !== null) {
        map.removeLayer(marker);
    }
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
