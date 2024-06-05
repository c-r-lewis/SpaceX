function updateCountdown(launchDate) {
    const label = $("#next-launch-label");
    const countdownDays = $("#countdown-days");
    const countdownHours = $("#countdown-hours");
    const countdownMinutes = $("#countdown-minutes");
    const countdownSeconds = $("#countdown-seconds");
    const symbol = $("#symbol");
    const now = new Date();

    const timeLeft = launchDate - now;

    if (timeLeft <= 0) {
        label.text("Dernier lancement : ");

        if (getNextLaunch()) return;

        const timeSinceLaunch = now - launchDate;

        const days = Math.floor(timeSinceLaunch / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (timeSinceLaunch % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
            (timeSinceLaunch % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((timeSinceLaunch % (1000 * 60)) / 1000);

        symbol.text("+");
        countdownDays.text(days.toString().padStart(2, "0"));
        countdownHours.text(hours.toString().padStart(2, "0"));
        countdownMinutes.text(minutes.toString().padStart(2, "0"));
        countdownSeconds.text(seconds.toString().padStart(2, "0"));
    } else {
        label.text("Prochain lancement : ");
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
            (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        symbol.text("");
        countdownDays.text(days.toString().padStart(2, "0"));
        countdownHours.text(hours.toString().padStart(2, "0"));
        countdownMinutes.text(minutes.toString().padStart(2, "0"));
        countdownSeconds.text(seconds.toString().padStart(2, "0"));
    }
}

function extractVideoID(url) {
    const regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regex);
    return match && match[2].length === 11 ? match[2] : null;
}

function createStars(numStars) {
    const viewportHeight = $(window).height();

    for (let i = 0; i < numStars; i++) {
        const star = $("<div>").addClass("star");

        const duration = Math.random() * 2 + 1;
        const delay = Math.random() * 10;

        star.css("--duration", `${duration}s`);
        star.css("--delay", `${delay}s`);
        star.css("left", `${Math.random() * 100}%`);
        star.css("top", `${Math.random() * viewportHeight}vh`);

        $("body").append(star);
    }
}

function formatDate(date, datePrecision) {
    const parsedDate = Date.parse(date);
    const formattedDate = new Date(parsedDate);

    switch (datePrecision) {
        case 'quarter':
            return `${formattedDate.getFullYear()} Q${Math.ceil((formattedDate.getMonth() + 1) / 3)}`;
        case 'half':
            return `${formattedDate.getFullYear()} H${Math.ceil((formattedDate.getMonth() + 1) / 6)}`;
        case 'year':
            return `${formattedDate.getFullYear()}`;
        case 'month':
            return `${formattedDate.getFullYear()}-${formattedDate.getMonth() + 1}`;
        case 'day':
            return `${formattedDate.getFullYear()}-${formattedDate.getMonth() + 1}-${formattedDate.getDate()}`;
        case 'hour':
            return `${formattedDate.getFullYear()}-${formattedDate.getMonth() + 1}-${formattedDate.getDate()} ${formattedDate.getHours()}`;
        default:
            return `${formattedDate.toISOString()}`;
    }
}


function fetchData(selectionType) {
    $.ajax({
        url: `https://api.spacexdata.com/${version}/launches/query`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            options: {
                limit: 10,
                sort: {
                    date_utc: "desc",
                },
                populate: ["launchpad", "payloads"],
            },
            query: {
                ...(selectionType === "success" || selectionType === "failure"
                    ? { success: selectionType === "success" }
                    : {}),
            },
        }),
        success: function (data) {

            const launchList = $("#launch-list");
            launchList.empty();

            Object.values(data.docs).forEach((launch, index) => {
                const launchDate = new Date(launch.date_utc);
                const customerSet = new Set();
                launch.payloads.forEach((payload) => {
                    payload.customers.forEach((customer) => {
                        customerSet.add(customer);
                    });
                });
                const customers = Array.from(customerSet).join(", ");

                const videoLink = launch.links.webcast
                    ? $("<li>")
                        .addClass("list-group-item")
                        .append(
                            $("<a>")
                                .attr("id", `video-link-${index}`)
                                .text("Vidéo")
                                .attr("href", `#video-link-${index}`)
                                .on("click", function () {
                                    $("#video-modal-title").text(launch.name);
                                    $("#youtube-video").attr(
                                        "src",
                                        `https://www.youtube.com/embed/${extractVideoID(
                                            launch.links.webcast
                                        )}`
                                    );
                                    $("#videoModal").modal("show");
                                })
                        )
                    : $("<li>")
                        .addClass("list-group-item")
                        .text("Pas de vidéo disponible");

                const currentRow = $("<div>").addClass("row my-3");
                const col = $("<div>").addClass("col-12");
                const card = $("<div>").addClass("card");
                const cardBody = $("<ul>")
                    .addClass("list-group list-group-flush")
                    .append(
                        $("<li>")
                            .addClass("list-group-item")
                            .text(
                                `Date de lancement : ${launchDate.getDate()}/${launchDate.getMonth()+1}/${launchDate.getFullYear()}`
                            ),
                        $("<li>")
                            .addClass("list-group-item d-flex flex-column")
                            .append(
                                $("<p>").text(
                                    launch.details ? launch.details : "Pas de description."
                                ),
                                $("<a>")
                                    .attr("href", launch.links.article)
                                    .text(
                                        launch.links.article
                                            ? "Plus d'infos"
                                            : "Pas d'article disponible"
                                    )
                            ),
                        $("<li>")
                            .addClass("list-group-item")
                            .append(
                                $("<img>")
                                    .addClass("img-fluid")
                                    .attr(
                                        "src",
                                        launch.links.flickr.original[0]
                                            ? launch.links.flickr.original[0]
                                            : launch.links.patch.small
                                    )
                                    .attr("alt", "Pas d'image disponible")
                            ),
                        $("<li>")
                            .addClass("list-group-item")
                            .text(
                                `Informations sur le lieu de lancement : ${launch.launchpad.name}. ${launch.launchpad.details}`
                            ),
                        videoLink,
                        $("<li>")
                            .addClass("list-group-item")
                            .text(
                                `Chargements envoyés : ${launch.payloads
                                    .map((payload) => payload.name)
                                    .join(", ")}`
                            ),
                        $("<li>")
                            .addClass("list-group-item")
                            .text(`Clients ayant envoyé un chargement : ${customers}`)
                    );

                const cardTitle = $("<div>")
                    .addClass("card-header d-flex")
                    .append(
                        $("<h5>")
                            .text(launch.name)
                            .append(
                                $("<span>")
                                    .addClass(
                                        `ms-3 badge text-bg-${
                                            launch.success ? "success" : "danger"
                                        }`
                                    )
                                    .text(launch.success ? "Succès" : "Echec")
                            )
                    );

                card.append(cardTitle, cardBody);
                col.append(card);

                currentRow.append(col);
                launchList.append(currentRow);
            });
        },
        error: function (error) {
            console.log("Error fetching data:", error);
        },
    });
}

function getNextLaunch() {
    $.ajax({
        url: `https://api.spacexdata.com/${version}/launches/next`,
        method: "GET",
        success: function (data) {
            if (currentLaunchDate) {
                if (currentLaunchDate === data.date_utc) {
                    clearInterval(countDownInterval);
                } else {
                    return false;
                }
            }

            currentLaunchDate = new Date(data.date_utc);

            countDownInterval = setInterval(function () {
                updateCountdown(currentLaunchDate);
            }, 1000);

            $("#next-launch-date").text(currentLaunchDate.toLocaleString());
            $("#next-launch-name").text(data.name);
            return true;
        },
    });
}
