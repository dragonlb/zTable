;
(function($) {
	var ajax = $.ajax;
	$.ajax = function(s) {
		var oldS = s.success;
		var oldE = s.exception;
		var isErr = false;
		s.dataFilter = function(data, type){
			try{
				var obj = jQuery.parseJSON(data);
				if(obj._ajaxerrmsg){
					if(obj._ajaxerrmsg ='timeOut'){
						top.location.reload();
						return false;
					}
					isErr = true;
					return obj._ajaxerrmsg;
				}
				isErr = false;
			}catch(e){
				isErr = false;
				return data;
			}
			return data;
		};
		if(oldS){
			s.success = function(data) {
				if (!isErr) {
					oldS(data);
				}else{
					exception(data);
				}
			};
		};

		s.error = function(data) {
			if (isErr) {
				exception(data);				
			}
		};
		function exception(data){
			var responseText = jQuery.parseJSON(data.responseText);
			if(oldE){
				oldE(responseText);
			}else{				
				alert(responseText&&responseText._ajaxerrmsg?responseText._ajaxerrmsg:"");
			}
		};

		ajax(s);
	};
})(jQuery);