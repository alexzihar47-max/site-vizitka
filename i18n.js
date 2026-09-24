// Языки сайта: русский (основной — тексты прямо в index.html), английский
// и арабский (справа налево). Элементы с переводом помечены в разметке:
//   data-i18n="ключ"                 — содержимое элемента
//   data-i18n-attr="alt=ключ;..."    — атрибуты (alt, aria-label, placeholder)
// Меняете русский текст на странице — поправьте здесь английский и арабский.
// Фрагменты с class="ph" — заглушки под ваши данные, как и в русской версии.
(function () {
  const DICT = {
    // ---------- заголовок вкладки и описание для поиска ----------
    'meta.title': {
      en: 'Interior design and architecture in Moscow — ONYX studio',
      ar: 'التصميم الداخلي والعمارة في موسكو — استوديو ONYX',
    },
    'meta.description': {
      en: 'Interior design for apartments and houses, architectural design and design supervision in Moscow and the Moscow region. The price is fixed in the contract. +7 925 376-03-75',
      ar: 'تصميم داخلي للشقق والمنازل، وتصميم معماري، وإشراف على التنفيذ في موسكو ومنطقة موسكو. السعر ثابت في العقد. ‎+7 925 376-03-75',
    },

    // ---------- шапка и меню ----------
    'nav.label': { en: 'Site sections', ar: 'أقسام الموقع' },
    'nav.about': { en: 'About', ar: 'عن الاستوديو' },
    'nav.services': { en: 'Services', ar: 'الخدمات' },
    'nav.projects': { en: 'Projects', ar: 'المشاريع' },
    'nav.process': { en: 'Process', ar: 'مراحل العمل' },
    'nav.contacts': { en: 'Contacts', ar: 'التواصل' },
    'nav.request': { en: 'Enquiry', ar: 'الطلب' },
    'nav.faq': { en: 'FAQ', ar: 'الأسئلة' },
    'logo.label': { en: 'ONYX — home', ar: 'ONYX — الصفحة الرئيسية' },
    'lang.label': { en: 'Site language', ar: 'لغة الموقع' },
    'menu.label': { en: 'Menu', ar: 'القائمة' },
    'cta.discuss': { en: 'Discuss a project', ar: 'ناقش مشروعك' },

    // ---------- главный экран ----------
    'hero.eyebrow': { en: 'Interior & architecture studio', ar: 'استوديو التصميم الداخلي والعمارة' },
    'hero.h1': {
      en: 'ONYX — interior design and architectural design in Moscow',
      ar: 'ONYX — تصميم داخلي وتصميم معماري في موسكو',
    },
    'hero.chip1': { en: 'completed projects', ar: 'مشروعاً منجزاً' },
    'hero.chip2.value': { en: '<span class="ph">9 years</span>', ar: '<span class="ph">9 سنوات</span>' },
    'hero.chip2': { en: 'in architecture and&nbsp;interiors', ar: 'في العمارة والتصميم الداخلي' },
    'hero.tag1': { en: 'Our own working drawings', ar: 'مخططات تنفيذية من إعدادنا' },
    'hero.tag2': { en: 'Design supervision', ar: 'الإشراف على التنفيذ' },
    'hero.contact': { en: 'Contact', ar: 'تواصل' },
    'hero.call': { en: 'Call +7 925 376-03-75', ar: 'اتصل على ‎+7 925 376-03-75' },
    'hero.request': { en: 'Leave a request', ar: 'اترك طلباً' },
    'hero.scroll': { en: 'Scroll', ar: 'مرّر للأسفل' },

    // подписи на чертежах
    'bp.living': { en: 'LIVING ROOM', ar: 'غرفة المعيشة' },
    'bp.kitchen': { en: 'KITCHEN', ar: 'المطبخ' },
    'bp.bedroom': { en: 'BEDROOM', ar: 'غرفة النوم' },
    'bp.facade': { en: 'FACADE 1–3', ar: 'الواجهة 1–3' },
    'bp.ppe': { en: 'PPE · hard hat', ar: 'معدات السلامة · خوذة' },
    'bp.section': { en: 'SECTION A–A · 1:50', ar: 'مقطع A–A · 1:50' },
    'bp.sheet': { en: 'Sheet AR-01 · Sketch', ar: 'لوحة AR-01 · مسودة' },
    'bp.a': { en: 'A', ar: 'A' },
    'bp.north': { en: 'N', ar: 'ش' },

    // бегущая строка
    'mq.interiors': { en: 'Interior design', ar: 'التصميم الداخلي' },
    'mq.architecture': { en: 'Architecture', ar: 'العمارة' },
    'mq.drawings': { en: 'Working drawings', ar: 'المخططات التنفيذية' },
    'mq.supervision': { en: 'Design supervision', ar: 'الإشراف على التنفيذ' },

    // ---------- интро ----------
    'lead.title': { en: 'We design <em>spaces</em> for living', ar: 'نصمّم <em>مساحات</em> للحياة' },
    'lead.text': {
      en: 'Interiors and homes you want to live in. From the first sketch to working drawings and handover — one architect leads the project from start to finish.',
      ar: 'تصاميم داخلية ومنازل يطيب العيش فيها. من الرسم الأول حتى المخططات التنفيذية وتسليم المشروع — مهندس معماري واحد يقود المشروع من بدايته إلى نهايته.',
    },
    'lead.more': { en: 'View projects', ar: 'شاهد المشاريع' },
    'lead.city': { en: 'City', ar: 'المدينة' },
    'lead.city.v': { en: '<span class="ph">Moscow and region</span>', ar: '<span class="ph">موسكو ومنطقتها</span>' },
    'lead.since': { en: 'Working since', ar: 'نعمل منذ' },
    'lead.since.v': { en: '<span class="ph">2016</span>', ar: '<span class="ph">2016</span>' },
    'lead.format': { en: 'Scope', ar: 'المجال' },
    'lead.format.v': { en: 'Interiors · Architecture', ar: 'تصميم داخلي · عمارة' },
    'lead.alt': { en: 'Residential building under construction', ar: 'مبنى سكني قيد الإنشاء' },
    'lead.label': { en: 'Your photo · property · 1200×1500', ar: 'صورتك · العقار · 1200×1500' },
    'lead.caption': { en: 'Project', ar: 'المشروع' },
    'lead.caption.v': { en: '<span class="ph">Project name</span>', ar: '<span class="ph">اسم المشروع</span>' },
    'badge.text': { en: 'Open for new projects • ', ar: 'نستقبل مشاريع جديدة • ' },

    // ---------- о студии ----------
    'about.kicker': { en: '<span>(01)</span> About', ar: '<span>(01)</span> عن الاستوديو' },
    'about.manifesto': {
      en: 'We are ONYX studio. We design interiors and homes where <em>every detail</em> works for your life: from the layout and lighting to the socket by the bed.',
      ar: 'نحن استوديو ONYX. نصمّم مساحات داخلية ومنازل تعمل فيها <em>كل تفصيلة</em> لخدمة حياتك: من المخطط والإضاءة حتى المقبس بجانب السرير.',
    },
    'about.alt': {
      en: 'Apartment plan with furniture layout — ONYX drawing',
      ar: 'مخطط شقة مع توزيع الأثاث — رسم من استوديو ONYX',
    },
    'about.label': { en: 'Your photo · studio or project · 1200×900', ar: 'صورتك · الاستوديو أو المشروع · 1200×900' },
    'about.caption': { en: 'Alexander Zhikharev, founder of ONYX', ar: 'ألكسندر جيخاريف، مؤسس ONYX' },
    'facts.1': { en: 'Turnkey', ar: 'تسليم مفتاح' },
    'facts.1.v': { en: 'Full cycle — from measurements to handover.', ar: 'دورة كاملة — من القياسات حتى تسليم المشروع.' },
    'facts.2': { en: 'Price', ar: 'السعر' },
    'facts.2.v': { en: 'Fixed in the contract before work begins.', ar: 'نثبّته في العقد قبل بدء العمل.' },
    'facts.3': { en: 'Payment', ar: 'الدفع' },
    'facts.3.v': { en: 'In stages — after each stage is approved.', ar: 'على مراحل — بعد اعتماد كل مرحلة.' },
    'facts.4': { en: 'Timeline', ar: 'المدة' },
    'facts.4.v': {
      en: 'Design project — in <span class="ph">6–10 weeks</span>.',
      ar: 'المشروع التصميمي — خلال <span class="ph">6–10 أسابيع</span>.',
    },

    // ---------- услуги ----------
    'services.kicker': { en: '<span>(02)</span> Services', ar: '<span>(02)</span> الخدمات' },
    'services.title': {
      en: 'We take care of <em>everything</em> —<br>from idea to keys',
      ar: 'نتولّى <em>كل شيء</em> —<br>من الفكرة حتى المفاتيح',
    },
    'services.text': {
      en: 'Interior design for apartments, houses and commercial spaces, architectural design of private houses, working drawings and design supervision — in <span class="ph">Moscow and the Moscow region</span>.',
      ar: 'تصميم داخلي للشقق والمنازل والمساحات التجارية، وتصميم معماري للمنازل الخاصة، ومخططات تنفيذية وإشراف على التنفيذ — في <span class="ph">موسكو ومنطقة موسكو</span>.',
    },
    's1.title': { en: 'Interior design project', ar: 'مشروع التصميم الداخلي' },
    's1.text': {
      en: 'Apartments and houses: layout, 3D visualisations, lighting, choice of materials and furniture.',
      ar: 'للشقق والمنازل: المخطط، والتصورات ثلاثية الأبعاد، والإضاءة، واختيار المواد والأثاث.',
    },
    's2.title': { en: 'Architectural design', ar: 'التصميم المعماري' },
    's2.text': {
      en: 'Private house projects: facades, reconstruction and landscaping.',
      ar: 'مشاريع المنازل الخاصة: الواجهات وإعادة التأهيل وتنسيق الموقع.',
    },
    's3.title': { en: 'Working drawings', ar: 'المخططات التنفيذية' },
    's3.text': {
      en: 'A complete set for builders: wall elevations, electrical, plumbing.',
      ar: 'مجموعة كاملة للمقاولين: مساقط الجدران والكهرباء والسباكة.',
    },
    's4.title': { en: 'Design supervision', ar: 'الإشراف على التنفيذ' },
    's4.text': {
      en: 'We visit the site and make sure it is built to the design.',
      ar: 'نزور الموقع ونتأكد من أن البناء يسير وفق التصميم.',
    },

    // ---------- проекты ----------
    'projects.kicker': { en: '<span>(03)</span> Projects', ar: '<span>(03)</span> المشاريع' },
    'projects.title': { en: 'Selected <em>work</em>', ar: 'أعمال <em>مختارة</em>' },
    'projects.more': { en: 'I want one like this', ar: 'أريد مثله' },
    'p1.alt': { en: 'Interior design of a family apartment — ONYX project', ar: 'تصميم داخلي لشقة عائلية — مشروع ONYX' },
    'p1.label': { en: 'Your photo · project 1 · 1200×1500', ar: 'صورتك · المشروع 1 · 1200×1500' },
    'p1.title': { en: '<span class="ph">Family apartment</span>', ar: '<span class="ph">شقة لعائلة</span>' },
    'p1.meta': { en: '<span class="ph">Residential interior · 86 m² · 2024</span>', ar: '<span class="ph">تصميم سكني · 86 م² · 2024</span>' },
    'p2.alt': { en: 'Architectural design of a country house — ONYX', ar: 'تصميم معماري لمنزل ريفي — ONYX' },
    'p2.label': { en: 'Your photo · project 2 · 1200×1500', ar: 'صورتك · المشروع 2 · 1200×1500' },
    'p2.title': { en: '<span class="ph">Country house</span>', ar: '<span class="ph">منزل ريفي</span>' },
    'p2.meta': { en: '<span class="ph">Architecture · 210 m² · 2023</span>', ar: '<span class="ph">عمارة · 210 م² · 2023</span>' },
    'p3.alt': { en: 'Interior design of an IT company office — ONYX', ar: 'تصميم داخلي لمكتب شركة تقنية — ONYX' },
    'p3.label': { en: 'Your photo · project 3 · 1200×1500', ar: 'صورتك · المشروع 3 · 1200×1500' },
    'p3.title': { en: '<span class="ph">IT company office</span>', ar: '<span class="ph">مكتب شركة تقنية</span>' },
    'p3.meta': { en: '<span class="ph">Commercial · 340 m² · 2024</span>', ar: '<span class="ph">تجاري · 340 م² · 2024</span>' },

    // ---------- цифры ----------
    'stats.label': { en: 'The studio in numbers', ar: 'الاستوديو بالأرقام' },
    'stat1': { en: 'completed projects', ar: 'مشروعاً منجزاً' },
    'stat2': { en: 'years in architecture', ar: 'سنوات في العمارة' },
    'stat3': { en: 'm² designed', ar: 'م² من التصميم' },
    'stat4': { en: 'of clients come by recommendation', ar: 'من العملاء يأتون بالتوصية' },

    // ---------- направления ----------
    'dir.kicker': { en: '<span>(04)</span> Disciplines', ar: '<span>(04)</span> الاتجاهات' },
    'dir.title': { en: 'Two disciplines —<br><em>one team</em>', ar: 'اتجاهان —<br><em>فريق واحد</em>' },
    'd1.alt': { en: 'Apartment interior design by ONYX', ar: 'تصميم داخلي لشقة من استوديو ONYX' },
    'd1.label': { en: 'Your photo · interior · 1000×1300', ar: 'صورتك · تصميم داخلي · 1000×1300' },
    'd1.tag': { en: 'Interiors', ar: 'التصميم الداخلي' },
    'd1.title': { en: 'An interior shaped <em>around your life</em>', ar: 'تصميم داخلي <em>على مقاس حياتك</em>' },
    'd1.text': {
      en: 'Apartments, houses, offices and cafés. We plan how you live, the lighting and the storage before the first wall goes up.',
      ar: 'شقق ومنازل ومكاتب ومقاهٍ. نخطط لطريقة الاستخدام والإضاءة والتخزين قبل أن يُبنى أول جدار.',
    },
    'd1.more': { en: 'Discuss an interior →', ar: 'ناقش تصميمك الداخلي ←' },
    'd2.alt': { en: 'Private house design by ONYX', ar: 'تصميم منزل خاص من استوديو ONYX' },
    'd2.label': { en: 'Your photo · architecture · 1000×1300', ar: 'صورتك · عمارة · 1000×1300' },
    'd2.tag': { en: 'Architecture', ar: 'العمارة' },
    'd2.title': { en: 'A house <em>that fits its site</em>', ar: 'منزل <em>منسجم مع موقعه</em>' },
    'd2.text': {
      en: 'We take into account the terrain, orientation and views so that the house works for you all year round.',
      ar: 'نراعي التضاريس واتجاهات الشمس والإطلالات ليخدمك المنزل طوال العام.',
    },
    'd2.more': { en: 'Discuss a house →', ar: 'ناقش منزلك ←' },

    // ---------- этапы ----------
    'proc.kicker': { en: '<span>(05)</span> Process', ar: '<span>(05)</span> مراحل العمل' },
    'proc.title': { en: 'How we <em>work</em>', ar: 'كيف <em>نعمل</em>' },
    'proc.text': {
      en: 'Five steps from the first meeting to handover. Each one ends with your approval — and only then do you pay for the next.',
      ar: 'خمس خطوات من اللقاء الأول حتى التسليم. تنتهي كل خطوة باعتمادك — وبعدها فقط تدفع مقابل الخطوة التالية.',
    },
    'proc.cta': { en: 'Start with a meeting', ar: 'ابدأ بلقاء' },
    'proc.alt': {
      en: 'Construction works on site — the architect’s supervision',
      ar: 'أعمال بناء في الموقع — إشراف المهندس المعماري',
    },
    'proc.label': { en: 'Your photo · on site · 1000×800', ar: 'صورتك · في الموقع · 1000×800' },
    'proc.caption': {
      en: 'Design supervision — on site, not over the phone',
      ar: 'الإشراف على التنفيذ — في الموقع، لا عبر الهاتف',
    },
    'step1': { en: 'Meeting and measurements', ar: 'اللقاء والقياسات' },
    'step1.text': {
      en: 'We discuss the brief, budget and timeline, then visit the site and take measurements.',
      ar: 'نناقش المهمة والميزانية والمدة، ثم نزور الموقع ونأخذ القياسات.',
    },
    'step1.time': { en: '<span class="ph">1–3 days</span>', ar: '<span class="ph">1–3 أيام</span>' },
    'step2': { en: 'Layout', ar: 'المخطط' },
    'step2.text': {
      en: 'We offer 2–3 options for walls and furniture and refine the one you choose.',
      ar: 'نقدّم 2–3 خيارات لتوزيع الجدران والأثاث ونطوّر الخيار الذي تختاره.',
    },
    'step2.time': { en: '<span class="ph">1–2 weeks</span>', ar: '<span class="ph">أسبوع إلى أسبوعين</span>' },
    'step3': { en: 'Concept and 3D', ar: 'الفكرة والتصور ثلاثي الأبعاد' },
    'step3.text': {
      en: 'Style, materials and visualisations of every room — you see the result before construction.',
      ar: 'الأسلوب والمواد وتصورات لكل غرفة — ترى النتيجة قبل البدء بالبناء.',
    },
    'step3.time': { en: '<span class="ph">2–4 weeks</span>', ar: '<span class="ph">2–4 أسابيع</span>' },
    'step4': { en: 'Working drawings', ar: 'المخططات التنفيذية' },
    'step4.text': {
      en: 'A complete set of documents that builders can follow without extra questions.',
      ar: 'مجموعة كاملة من الوثائق يبني عليها المقاول دون أسئلة إضافية.',
    },
    'step4.time': { en: '<span class="ph">2–3 weeks</span>', ar: '<span class="ph">2–3 أسابيع</span>' },
    'step5': { en: 'Design supervision', ar: 'الإشراف على التنفيذ' },
    'step5.text': {
      en: 'We visit the site and oversee construction until the keys are handed over.',
      ar: 'نزور الموقع ونتابع البناء حتى تسليم المفاتيح.',
    },
    'step5.time': { en: 'until handover', ar: 'حتى التسليم' },

    // ---------- вопросы ----------
    'faq.kicker': { en: '<span>(06)</span> FAQ', ar: '<span>(06)</span> الأسئلة' },
    'faq.title': { en: 'Frequently asked <em>questions</em>', ar: 'الأسئلة <em>الشائعة</em>' },
    'faq.text': {
      en: 'Didn’t find an answer? Call <a href="tel:+79253760375" dir="ltr">+7 925 376-03-75</a> or leave a request — an architect will reply within one working day.',
      ar: 'لم تجد إجابتك؟ اتصل على <a href="tel:+79253760375" dir="ltr">+7 925 376-03-75</a> أو اترك طلباً — وسيرد عليك مهندس معماري خلال يوم عمل.',
    },
    'q1': { en: 'How much does an interior design project cost?', ar: 'كم تبلغ تكلفة مشروع التصميم الداخلي؟' },
    'a1': {
      en: 'The cost depends on the area and the scope and is calculated per square metre — from <span class="ph">2,500 ₽/m²</span>. We fix the total in the contract before work begins, and it does not change.',
      ar: 'تعتمد التكلفة على المساحة ونطاق المشروع وتُحتسب لكل متر مربع — ابتداءً من <span class="ph">2,500 روبل/م²</span>. نثبّت المبلغ النهائي في العقد قبل بدء العمل، ولا يتغيّر.',
    },
    'q2': { en: 'How long does an apartment design project take?', ar: 'كم يستغرق مشروع تصميم شقة؟' },
    'a2': {
      en: 'On average <span class="ph">6–10 weeks</span>: measurements, layout, a concept with 3D visualisations and working drawings. The timing of each stage is set out in the contract.',
      ar: 'في المتوسط <span class="ph">6–10 أسابيع</span>: القياسات، والمخطط، والفكرة مع تصورات ثلاثية الأبعاد، والمخططات التنفيذية. نحدد مدة كل مرحلة في العقد.',
    },
    'q3': { en: 'What does a design project include?', ar: 'ماذا يشمل المشروع التصميمي؟' },
    'a3': {
      en: 'A measured plan, layout solutions, 3D visualisations of every room, working drawings — wall, electrical, plumbing, ceiling and floor plans and wall elevations — and a specification of materials and furniture.',
      ar: 'مخطط القياسات، وحلول التوزيع، وتصورات ثلاثية الأبعاد لجميع الغرف، والمخططات التنفيذية — مخططات الجدران والكهرباء والسباكة والأسقف والأرضيات ومساقط الجدران — إضافةً إلى جدول مواصفات المواد والأثاث.',
    },
    'q4': { en: 'Do you design private houses?', ar: 'هل تصممون منازل خاصة؟' },
    'a4': {
      en: 'Yes. We create architectural designs for private houses: sketch, floor plans, facades, working documents and landscaping. We can handle both the architecture and the interior of the same property.',
      ar: 'نعم. نُعدّ التصميم المعماري للمنازل الخاصة: المسودة، والمخططات، والواجهات، والوثائق التنفيذية، وتنسيق الموقع. ويمكننا تولّي العمارة والتصميم الداخلي للمشروع نفسه.',
    },
    'q5': { en: 'Why is design supervision needed?', ar: 'لماذا نحتاج إلى الإشراف على التنفيذ؟' },
    'a5': {
      en: 'So that construction follows the design exactly. The architect visits the site, answers the builders’ questions, checks details and materials and makes adjustments. This protects you from mistakes that are expensive to fix.',
      ar: 'لكي يسير البناء وفق التصميم تماماً. يزور المهندس المعماري الموقع، ويجيب عن أسئلة المقاولين، ويتحقق من التفاصيل والمواد، ويُجري التعديلات اللازمة. وهذا يحميك من أخطاء يكلّف إصلاحها كثيراً.',
    },
    'q6': { en: 'Which cities do you work in?', ar: 'في أي المدن تعملون؟' },
    'a6': {
      en: 'In <span class="ph">Moscow and the Moscow region</span>. For other cities we can work remotely, with the architect visiting at key stages.',
      ar: 'في <span class="ph">موسكو ومنطقة موسكو</span>. وفي المدن الأخرى يمكننا العمل عن بُعد مع زيارات المهندس المعماري في المراحل الرئيسية.',
    },

    // ---------- заявка ----------
    'req.kicker': { en: '<span>(07)</span> Enquiry', ar: '<span>(07)</span> الطلب' },
    'req.title': { en: 'Let’s discuss <em>your project</em>', ar: 'لنناقش <em>مشروعك</em>' },
    'req.text': {
      en: 'Leave a request — an architect will contact you within one working day and explain where to start.',
      ar: 'اترك طلباً — وسيتواصل معك مهندس معماري خلال يوم عمل ويشرح لك من أين نبدأ.',
    },
    'form.name': { en: 'Name', ar: 'الاسم' },
    'form.name.ph': { en: 'How should we address you', ar: 'كيف نناديك' },
    'form.phone': { en: 'Phone', ar: 'الهاتف' },
    'form.message': { en: 'Message', ar: 'الرسالة' },
    'form.message.ph': { en: 'Property type, area, timeline', ar: 'نوع العقار، المساحة، المدة' },
    'form.submit': { en: 'Send request', ar: 'أرسل الطلب' },
    'form.consent': {
      en: 'By clicking the button, you agree to the processing of your personal data.',
      ar: 'بالضغط على الزر، أنت توافق على معالجة بياناتك الشخصية.',
    },

    // ---------- подвал ----------
    'footer.lead': {
      en: 'Have an idea or a plot?<br><em>Write to us</em> — we reply the same day.',
      ar: 'لديك فكرة أو قطعة أرض؟<br><em>راسلنا</em> — نرد في اليوم نفسه.',
    },
    'footer.sections': { en: 'Sections', ar: 'الأقسام' },
    'footer.contacts': { en: 'Contacts', ar: 'التواصل' },
    'footer.address': { en: '<span class="ph">1 Primernaya St, Moscow</span>', ar: '<span class="ph">موسكو، شارع بريميرنايا، 1</span>' },
    'footer.social': { en: 'Social', ar: 'التواصل الاجتماعي' },
    'footer.vk': { en: 'VK', ar: 'VK' },
    'footer.copy': {
      en: 'ONYX — interior design and architectural design in Moscow and the Moscow region.',
      ar: 'ONYX — تصميم داخلي وتصميم معماري في موسكو ومنطقة موسكو.',
    },
    'footer.top': { en: 'Back to top', ar: 'إلى الأعلى' },

    // ---------- тексты из script.js ----------
    'js.menu.open': { en: 'Open menu', ar: 'فتح القائمة' },
    'js.menu.close': { en: 'Close menu', ar: 'إغلاق القائمة' },
    'js.rail.prev': { en: 'Previous', ar: 'السابق' },
    'js.rail.next': { en: 'Next', ar: 'التالي' },
    'js.form.sending': { en: 'Sending...', ar: 'جارٍ الإرسال...' },
    'js.form.success': { en: 'Request sent, we will contact you', ar: 'تم إرسال الطلب، وسنتواصل معك' },
    'js.form.error': { en: 'Could not send the request. Please try again.', ar: 'تعذّر إرسال الطلب. حاول مرة أخرى.' },
    'js.form.required': { en: 'Please fill in your name and phone.', ar: 'يرجى إدخال الاسم ورقم الهاتف.' },
  };

  const LANGS = ['ru', 'en', 'ar'];
  const STORE_KEY = 'onyx-lang';
  const root = document.documentElement;

  const textEls = Array.from(document.querySelectorAll('[data-i18n]'));
  const attrEls = Array.from(document.querySelectorAll('[data-i18n-attr]'));
  // стрелки, которые в арабской версии смотрят в другую сторону
  const arrowEls = Array.from(document.querySelectorAll(
    '.pill__arrow, .service__arrow, .link-arrow > span[aria-hidden], .badge-spin__arrow'
  ));
  const MIRROR = { '→': '←', '←': '→', '↗': '↖', '↖': '↗' };

  // русские тексты берём прямо со страницы — до того, как их что-то поменяет
  const ruText = new Map(textEls.map(function (el) { return [el, el.innerHTML]; }));
  const ruAttr = new Map(attrEls.map(function (el) {
    const saved = {};
    parsePairs(el).forEach(function (pair) { saved[pair[0]] = el.getAttribute(pair[0]); });
    return [el, saved];
  }));
  const arrowText = new Map(arrowEls.map(function (el) { return [el, el.textContent]; }));
  const metaDescription = document.querySelector('meta[name="description"]');
  const canonical = document.querySelector('link[rel="canonical"]');
  const ruTitle = document.title;
  const ruDescription = metaDescription ? metaDescription.content : '';

  let current = 'ru';

  function parsePairs(el) {
    return el.dataset.i18nAttr.split(';').map(function (part) {
      const i = part.indexOf('=');
      return [part.slice(0, i).trim(), part.slice(i + 1).trim()];
    });
  }

  function pick(key, lang, fallback) {
    const entry = DICT[key];
    return lang !== 'ru' && entry && entry[lang] != null ? entry[lang] : fallback;
  }

  // перевод для script.js: onyxT('ключ', 'русский текст')
  window.onyxT = function (key, ru) { return pick(key, current, ru); };
  window.onyxLang = function () { return current; };

  function apply(lang) {
    current = lang;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';

    textEls.forEach(function (el) {
      el.innerHTML = pick(el.dataset.i18n, lang, ruText.get(el));
    });
    attrEls.forEach(function (el) {
      const saved = ruAttr.get(el);
      parsePairs(el).forEach(function (pair) {
        el.setAttribute(pair[0], pick(pair[1], lang, saved[pair[0]]));
      });
    });
    arrowEls.forEach(function (el) {
      const text = arrowText.get(el);
      el.textContent = root.dir === 'rtl' ? (MIRROR[text] || text) : text;
    });

    document.title = pick('meta.title', lang, ruTitle);
    if (metaDescription) metaDescription.content = pick('meta.description', lang, ruDescription);
    if (canonical) {
      const base = canonical.href.split('?')[0];
      canonical.href = lang === 'ru' ? base : base + '?lang=' + lang;
    }

    // переключатель в шапке
    document.querySelectorAll('.lang__code').forEach(function (el) { el.textContent = lang.toUpperCase(); });
    document.querySelectorAll('.lang__list [data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-checked', String(btn.dataset.lang === lang));
    });

    // сайт перестраивает то, что зависит от текста (слова манифеста, ленты)
    document.dispatchEvent(new CustomEvent('onyx:lang', { detail: { lang: lang } }));
  }

  function remember(lang) {
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* без памяти */ }
    try {
      const url = new URL(location.href);
      if (lang === 'ru') url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
      history.replaceState(null, '', url);
    } catch (e) { /* адрес не меняем */ }
  }

  // ---------- переключатель языка ----------
  const box = document.querySelector('.lang');
  if (box) {
    const btn = box.querySelector('.lang__btn');
    const setOpen = function (open) {
      box.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!box.classList.contains('is-open'));
    });
    box.querySelectorAll('[data-lang]').forEach(function (option) {
      option.addEventListener('click', function () {
        const lang = option.dataset.lang;
        setOpen(false);
        btn.focus();
        if (lang === current) return;
        apply(lang);
        remember(lang);
      });
    });
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && box.classList.contains('is-open')) {
        setOpen(false);
        btn.focus();
      }
    });
  }

  // язык при загрузке: из адреса (?lang=en), иначе — выбранный раньше
  let start = 'ru';
  try {
    start = new URLSearchParams(location.search).get('lang') || localStorage.getItem(STORE_KEY) || 'ru';
  } catch (e) { /* по умолчанию русский */ }
  if (LANGS.indexOf(start) < 0) start = 'ru';
  if (start !== 'ru') apply(start);
})();
