
  const scrollContainer = document.getElementById('categoryScroll');
  const scrollAmount = 150;

  document.getElementById('scrollLeft').addEventListener('click', () => {
    scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  document.getElementById('scrollRight').addEventListener('click', () => {
    scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });


  document.addEventListener("DOMContentLoaded", function () {
    const heroCard = document.querySelector('.hero-card');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          heroCard.classList.add('show');
        }
      });
    }, {
      threshold: 0.3
    });

    observer.observe(heroCard);
  });


 



// animasi  pcard categori

  document.addEventListener("DOMContentLoaded", function () {
    const categoryItems = document.querySelectorAll('.scroll-container > div');
    const leftCard = document.querySelector('.promo-card.left');
    const rightCard = document.querySelector('.promo-card.right');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains('promo-card')) {
            if (entry.target.classList.contains('left')) {
              entry.target.classList.add('show-left');
            } else if (entry.target.classList.contains('right')) {
              entry.target.classList.add('show-right');
            }
          } else {
            entry.target.classList.add('show');
          }
        }
      });
    }, { threshold: 0.3 });

    categoryItems.forEach(item => observer.observe(item));
    if (leftCard) observer.observe(leftCard);
    if (rightCard) observer.observe(rightCard);
  });

