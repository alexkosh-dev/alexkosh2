// Определяем переменную "preprocessor"
let preprocessor = "sass"; // Выбор препроцессора в проекте - sass или less


const { src, dest, parallel, series, watch } = require("gulp"); // Определяем константы Gulp


const browserSync = require("browser-sync").create(); // Подключаем Browsersync
const concat = require("gulp-concat"); // Подключаем gulp-concat
const uglify = require("gulp-uglify-es").default; // Подключаем gulp-uglify-es
const sass = require("gulp-sass")(require("sass")); // Подключаем модули gulp-sass и gulp-less
const autoprefixer = require("gulp-autoprefixer"); // Подключаем Autoprefixer
const cleancss = require("gulp-clean-css"); // Подключаем модуль gulp-clean-css
const imagecomp = require("compress-images"); // Подключаем compress-images для работы с изображениями
const clean = require("gulp-clean"); // Подключаем модуль gulp-clean (вместо del)


// Определяем логику работы Browsersync
function browsersync() {
  browserSync.init({
    // Инициализация Browsersync
    server: { baseDir: "app/" }, // Указываем папку сервера
    notify: false, // Отключаем уведомления
    online: true, // Режим работы: true или false
  });
}


function scripts() {
  return src([
    // Берем файлы из источников
    //TODO "node_modules/jquery/dist/jquery.min.js", -- Пример подключения библиотеки
    "app/js/main.js", // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
  ])
    .pipe(concat("main.min.js")) // Конкатенируем в один файл
    .pipe(uglify()) // Сжимаем JavaScript
    .pipe(dest("app/js/")) // Выгружаем готовый файл в папку назначения
    .pipe(browserSync.stream()); // Триггерим Browsersync для обновления страницы
}


function styles() {
  return src("app/scss/style.scss") // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
    .pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
    .pipe(concat("style.min.css")) // Конкатенируем в файл 'style.min.css'
    .pipe(
      autoprefixer({ overrideBrowserslist: ["last 10 versions"], grid: true })
    ) // Создадим префиксы с помощью Autoprefixer
    .pipe(
      cleancss({
        level: { 1: { specialComments: 0 } } /* , format: 'beautify' */,
      })
    ) // Минифицируем стили
    .pipe(dest("app/css/")) // Выгрузим результат в папку "app/css/"
    .pipe(browserSync.stream()); // Сделаем инъекцию в браузер
}


async function images() {
  imagecomp(
    "app/images/**/*", // Берём все изображения из папки источника
    "dist/images/", // Выгружаем оптимизированные изображения в папку назначения
    { compress_force: false, statistic: true, autoupdate: true },
    false, // Настраиваем основные параметры
    { jpg: { engine: "mozjpeg", command: ["-quality", "75"] } }, // Сжимаем и оптимизируем изображеня
    { png: { engine: "pngquant", command: ["--quality=75-100", "-o"] } },
    { svg: { engine: "svgo", command: "--multipass" } },
    {
      gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] },
    },
    function (err, completed) {
      // Обновляем страницу по завершению
      if (completed === true) {
        browserSync.reload();
      }
    }
  );
}


function cleanimg() {
  return src("dist/images", { allowEmpty: true }).pipe(clean()); // Удаляем папку "'dist/images'"
}


function build() {
  return src(
    [
      "app/css/style.min.css",
      "app/fonts/**/*",
      "app/js/main.min.js",
      "app/*.html",
    ],
    { base: "app" }
  ).pipe(dest("dist"));
}


function cleandist() {
  return src("dist", { allowEmpty: true }).pipe(clean()); // Удаляем папку "dist/"
}


function watching() {
  // Мониторим файлы HTML на изменения
  watch("app/**/*.html").on("change", browserSync.reload);
  // Мониторим файлы препроцессора на изменения
  watch("app/**/scss/**/*", styles);
  // Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
  watch(["app/js/**/*.js", "!app/js/main.min.js"], scripts);
  // Мониторим папку-источник изображений и выполняем images(), если есть изменения
  watch("app/images/**/*", images);
  watch("app/fonts/**/*");
}


// Экспортируем функцию browsersync() как таск browsersync. Значение после знака = это имеющаяся функция.
exports.browsersync = browsersync;
// Экспортируем функцию scripts() в таск scripts
exports.scripts = scripts;
// Экспортируем функцию styles() в таск styles
exports.styles = styles;
// Экспорт функции images() в таск images
exports.images = images;
// Экспортируем функцию cleanimg() как таск cleanimg
exports.cleanimg = cleanimg;

// Создаем новый таск "build", который последовательно выполняет нужные операции
exports.build = series(cleandist, styles, scripts, images, build);
// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(styles, scripts, browsersync, watching);
