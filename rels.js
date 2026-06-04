(function(){const _0x1a2b={"01":"guide","02":"about","03":"contact","04":"terms-of-service","05":"privacy-policy","06":"wifi-list"};const _0x3c4d=new URLSearchParams(window.location.search).get('id');if(_0x3c4d&&_0x1a2b[_0x3c4d]){window.location.href=_0x1a2b[_0x3c4d];}})();
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    document.addEventListener('keydown', function(e) {
        // Blokir F12
        if (e.key === "F12") {
            e.preventDefault();
            return false;
        }
        
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            return false;
        }

        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
            e.preventDefault();
            return false;
        }
    });
    
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });

    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });