/* @license GPL-2.0-or-later https://www.drupal.org/licensing/faq */
(function(){const settingsElement=document.querySelector('head > script[type="application/json"][data-drupal-selector="drupal-settings-json"], body > script[type="application/json"][data-drupal-selector="drupal-settings-json"]');window.drupalSettings={};if(settingsElement!==null)window.drupalSettings=JSON.parse(settingsElement.textContent);})();;

/* Hide skip-link by default, show on keyboard focus */
(function(){
  function hideSkipLink(){
    document.querySelectorAll('.skip-link').forEach(function(link){
      link.style.position='fixed';
      link.style.top='0';
      link.style.left='1rem';
      link.style.zIndex='9999';
      link.style.transform='translateY(-200%)';
      link.style.background='#fff';
      link.style.padding='.75rem 1rem';
      link.style.textDecoration='none';
      link.style.color='#000';
      link.style.transition='transform .2s ease';
      link.addEventListener('focus',function(){link.style.transform='translateY(0)';});
      link.addEventListener('blur',function(){link.style.transform='translateY(-200%)';});
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',hideSkipLink);
  } else {
    hideSkipLink();
  }
})();

/* Hide skip-link by default, show on keyboard focus - robust version */
(function(){
  function fixSkipLink(link){
    if(link.dataset.skipLinkFixed) return;
    link.dataset.skipLinkFixed = '1';
    link.style.position='fixed';
    link.style.top='0';
    link.style.left='1rem';
    link.style.zIndex='9999';
    link.style.transform='translateY(-200%)';
    link.style.background='#fff';
    link.style.padding='.75rem 1rem';
    link.style.textDecoration='none';
    link.style.color='#000';
    link.style.transition='transform .2s ease';
    link.addEventListener('focus',function(){link.style.transform='translateY(0)';});
    link.addEventListener('blur',function(){link.style.transform='translateY(-200%)';});
  }
  function fixAllSkipLinks(){
    document.querySelectorAll('.skip-link').forEach(fixSkipLink);
  }
  // Fix immediately if already present
  fixAllSkipLinks();
  // Fix when DOM changes (for dynamically loaded headers)
  var observer = new MutationObserver(function(){
    fixAllSkipLinks();
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});
  // Also fix after load
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',fixAllSkipLinks);
  }
  window.addEventListener('load',function(){setTimeout(fixAllSkipLinks,100);});
})();

/* Hide skip-link by default, show on keyboard focus - robust v2 */
(function(){
  function fixSkipLink(link){
    if(link.dataset.skipLinkFixed2) return;
    link.dataset.skipLinkFixed2 = '1';
    // Remove visually-hidden class to avoid !important conflicts
    link.classList.remove('visually-hidden');
    // Use setProperty with !important to override any CSS
    link.style.setProperty('position','fixed','important');
    link.style.setProperty('top','0','important');
    link.style.setProperty('left','1rem','important');
    link.style.setProperty('z-index','9999','important');
    link.style.setProperty('transform','translateY(-200%)','important');
    link.style.setProperty('background','#fff','important');
    link.style.setProperty('padding','.75rem 1rem','important');
    link.style.setProperty('text-decoration','none','important');
    link.style.setProperty('color','#000','important');
    link.style.setProperty('transition','transform .2s ease','important');
    link.style.setProperty('clip','auto','important');
    link.style.setProperty('width','auto','important');
    link.style.setProperty('height','auto','important');
    link.style.setProperty('overflow','visible','important');
    link.addEventListener('focus',function(){
      link.style.setProperty('transform','translateY(0)','important');
    });
    link.addEventListener('blur',function(){
      link.style.setProperty('transform','translateY(-200%)','important');
    });
  }
  function fixAllSkipLinks(){
    document.querySelectorAll('.skip-link').forEach(fixSkipLink);
  }
  fixAllSkipLinks();
  var observer = new MutationObserver(function(){
    fixAllSkipLinks();
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',fixAllSkipLinks);
  }
  window.addEventListener('load',function(){setTimeout(fixAllSkipLinks,100);});
})();
