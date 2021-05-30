class IndexSettingBackendEKP extends BaseBackendEKP {
  constructor() {
    super();
    this.initialize();
  }

  initialize() {
    this.form = new FormSettingBackendEKP(this);
  }
}
class FormSettingBackendEKP {
  constructor(opts) {
    _.extend(this, opts);
    this.formId = 'formSetting';
    this.formObj = $('#' + this.formId);
    
    this.alert = this.formObj.find('.alert');

    this.countSlot = parseInt($('#general').attr('data-countSlot'));
    this.countSlider = parseInt($('#web').attr('data-countSlider'));
    this.backgroundSliders = {};
    this.uploadedAboutThumb = $('#webAboutThumb').attr('data-default-file')!='/images/no-thumb.png' ? $('#webAboutThumb').attr('data-default-file'): '';
    // this.uploadedTeacherBackground = $('#webTeacherBackground').attr('data-default-file')!='/images/no-thumb.png' ? $('#webTeacherBackground').attr('data-default-file'): '';
    this.initialize();
  }

  initialize() {
    let _this = this;
    _this.initValidation();
    _this.initRepeater();
    _this.initTimePicker();
		_this.initUploadFile();
    _this.initEditorSettingForm();
    $('.js-process-basic-multiple').select2({width: '100%'});
  } 

  initValidation() {
    let _this = this;
    _this.formObj.formValidation({
      button: {
        selector: '#btnFormSetting',
        disabled: 'disabled'
      },
      fields: {
        //Can combine both html5 mode and js mode
        //Refer: http://formvalidation.io/examples/attribute/
        /*alias: {
          validators: {
            notEmpty: {
              message: 'The title is required and cannot be empty'
            }
          }
        },*/
      },
      err: {
        clazz: 'invalid-feedback'
      },
      control: {
        // The CSS class for valid control
        valid: 'is-valid',
        // The CSS class for invalid control
        invalid: 'is-invalid'
      },
      row: {
        invalid: 'has-danger'
      },
      onSuccess: function (e) {
        //e.preventDefault();
        //console.log('FORM can submit OK');
      }
    })
      .on('success.form.fv', function (e) {
        // Prevent form submission
        e.preventDefault();
        console.log('----- FORM Setting ----- [SUBMIT][START]');
        let $form = $(e.target);
        let formData = $form.serializeArray();
        let tmpData = {};
        _.each(formData, (item) => {
          if (!item.name.includes('slotFeedings') && !item.name.includes('sliders') && item.name != 'weekend') {
            tmpData[item.name] = item.value;
          }
        });
        //get weekend
        tmpData.weekend = $('#weekend').val();

        //save path of images
        tmpData.webAboutThumb = _this.uploadedAboutThumb;
        // tmpData.webTeacherBackground = _this.uploadedTeacherBackground;
        //get all array {time+food} of all repeater
        let repeaterArr = $('.repeater').repeaterVal();
        tmpData.rangeTimeMenu = repeaterArr.slotFeedings;
        if (tmpData.rangeTimeMenu.length == 0) {
          _this.alert.removeClass('hidden alert-success').addClass("alert-danger").html('Name and time of menu slot is required!');
        }
        //check data slot feedings empty
        let isValid = true;
        for (let slot of tmpData.rangeTimeMenu) {
          if (slot.name == '' || slot.timeStart == '' || slot.timeEnd == '' ) { isValid = false; }
        }

        //get data background of sliders
        for (let i = 0; i < repeaterArr.sliders.length; i++){
          repeaterArr.sliders[i].background = _this.backgroundSliders['sliders['+i+'][background]'];
        }
        tmpData.webSliders = repeaterArr.sliders;
        
        if (isValid) {
          let manner = _this.formObj.attr('data-manner');
          //reset form validator
          if (manner === 'edit') {
            Cloud.editSetting.with(tmpData).protocol('jQuery').exec((err, responseBody, responseObjLikeJqXHR) => {
              if (err) {
                _this.alert.removeClass('d-none').addClass("alert-danger").html(_this.messages.error);
                setTimeout(function () {
                  _this.alert.removeClass('alert-danger').addClass("d-none");
                }, 3000);
                return;
              }
              else {_this.alert.removeClass('d-none').addClass("alert-success").html(_this.messages.editSuccess);
              setTimeout(function () {
                _this.alert.removeClass('alert-success').addClass("d-none");
              }, 3000);}
              $('#btnFormSetting').removeAttr("disabled").removeClass("disabled");
            });
          }
          console.log('----- FORM Setting ----- [SUBMIT][END]');
        } else {
          _this.alert.removeClass('hidden alert-success').addClass("alert-danger").html('Please check the data input of menu setting!');
        }
      });
  }

  initEditorSettingForm = function () {
    $('.editor').summernote({
      height: 100, // set editor height
      minHeight: null, // set minimum height of editor
      maxHeight: null, // set maximum height of editor
      focus: true // set focus to editable area after initializing summernote
    });
  }
  
  initUploadFile() {
    let _this = this;

    //init dropify
    $('.dropify').dropify();

    //init value of backgroundSliders
    if (_this.countSlider > 0) {
      for (let i = 0; i < _this.countSlider; i++){
        let name = 'sliders[' + i + '][background]';
        let value = _this.formObj.find('input[type="file"][name="' + name + '"]').attr('data-default-file');
        _this.backgroundSliders[name] = value != '/images/no-thumb.png' ? value : '';
      }
    }

    let inputFiles = _this.formObj.find('[type=file]');
    if (inputFiles.length) {
      if (_this.uploadedBanner == undefined) {
        _this.uploadedBanner = "";
      }
      inputFiles.each((i, input) => {
        $(input).on('change', (e) => {
          let _file = e.currentTarget.files[0];
          let _ext = _this.getFileExtension(_file, ['.png', '.jpg', '.jpeg', '.gif']);
          if (_file && _this.checkValidFile(_file, ['.png', '.jpg', '.jpeg', '.gif'])) {
            let _data = {
              thumbnail: _file,
              ext: _ext,
              _csrf: $('[name="_csrf"]').val()
            };
            Cloud.uploadHomeSetting.with(_data).protocol('jQuery').exec((err, responseBody, responseObjLikeJqXHR) => {
              if (err) {
                if (err.responseInfo && err.responseInfo.data && err.responseInfo.data.raw == "E_EXCEEDS_UPLOAD_LIMIT" || err.responseInfo && err.responseInfo.statusCode == 500) {
                  swal({
                    title: _this.messages.cannotUploadExcceedMaxSize,
                    icon: 'error',
                    button: {
                     text: _this.messages.continue,
                      value: true,
                      visible: true,
                      className: "btn btn-primary"
                    }
                  }).then((value) => {
                    //THEN RELOAD PAGE IF NEEDED 
                    window.location.reload();
                  })
                }
                console.log(err);
                //_this.error.removeClass('hidden');
                return;
              }
              //save thumb data
              console.log(responseBody);
              if (e.currentTarget.name == 'webAboutThumb') {
                _this.uploadedAboutThumb = responseBody;
              } else {
                _this.backgroundSliders[e.currentTarget.name] = responseBody;
              }

            })
            let _input = $(e.currentTarget);
            _input.parents('.fileinput').parent().prev().addClass('loading');
          } else if (_file != undefined) {
            $(e.currentTarget).parents('.fileinput').find('.has-error').html('Undefined');
          } else {
            $(e.currentTarget).parents('.fileinput').find('.has-error').html('');
          }
        });
      });
    }
  }

  checkValidFile(file, _ext) {
    let valid = false;

    _.each(_ext, (ext, i) => {
      if (file.name.indexOf(ext) != -1) {
        valid = true;
      }
    });
    return valid;
  }

  getFileExtension(file, _ext) {
    let pos = '';
    _.each(_ext, (ext, i) => {
      if (file.name.indexOf(ext) != -1) {
        pos = ext;
      }
    });
    return pos;
  }

  initRepeater() {
    let _this = this;
    $('#repeaterRangeTimeMenu').repeater({
      defaultValues: {
        'text-input': 'foo'
      },
      show: function () {
        $(this).slideDown();
        $(this).find(".datetimepicker-input").attr('id', "timeStart" + _this.countSlot);
        $(this).find(".datetimepicker-input").attr('id', "timeEnd" + _this.countSlot);
        _this.initTimePicker();
        _this.countSlot++;
      },
      hide: function (deleteElement) {
        _this.initSweetAlert($(this), deleteElement);
      },
      isFirstItemUndeletable: true
    });

    $('#repeaterSlider').repeater({
      defaultValues: {
        'text-input': 'foo'
      },
      show: function () {
        $(this).slideDown();
        $('.dropify').dropify();
        _this.initUploadFile();
        _this.countSlider++;
      },
      hide: function (deleteElement) {
        _this.initSweetAlert($(this), deleteElement);
      },
      isFirstItemUndeletable: true
    });
  }
  
  initTimePicker() {
    $('.bootstrap-datetimepicker-input').bootstrapMaterialDatePicker({
      date: false,
      format: 'HH:mm',
      switchOnClick: true
    });
  }

  initSweetAlert(element, deleteElement) {
    swal({
      title: this.messages.deleteRow,
      icon: 'warning',
      cancelButtonColor: '#ff4081',
      buttons: {
        cancel: {
          text: this.messages.cancel,
          value: null,
          visible: true,
          className: "btn btn-danger",
          closeModal: true,
        },
        confirm: {
          text: "OK",
          value: true,
          visible: true,
          className: "btn btn-primary",
          closeModal: true
        }
      }
    }).then((value) => {
      if (value) {
        element.slideUp(deleteElement);
      }
    });
  }
}