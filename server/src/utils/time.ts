

const TIME = {
    time: <Intl.DateTimeFormatOptions>{
        hour: "numeric",
        minute: "numeric",
    },
    dayMonthTime: <Intl.DateTimeFormatOptions>{
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    },
    dayMonth: <Intl.DateTimeFormatOptions>{
        month: "short",
        day: "numeric",
    },

};


function convertTime(time?: number, format: Intl.DateTimeFormatOptions = TIME.time) {
    if (!time) {
        return null!;
    }
    return Intl.DateTimeFormat("en-CA", format).format(time);
}


function getDelay(time?: number): { hours: number; minutes: number; nextMinute: number } {

    if (!time) {
        return null!;
    }

    const delay = Date.now() - time;

    return {
        hours: Math.floor(delay / 3_600_000),
        minutes: Math.floor((delay % 3_600_000) / 60000),
        nextMinute: 60000 - Math.floor((delay % 3_600_000) % 60000),
    };
}

function getRelativeDelay(relativeTo: number, time?: number) {
    if (!time) {
        return null;
    }

    const delay = relativeTo - time;

    return {
        hours: -Math.floor(delay / 3_600_000),
        minutes: -Math.floor((delay % 3_600_000) / 60000),
        nextMinute: null!,
    };
}

export {
    convertTime,
    getDelay,
    getRelativeDelay,
    TIME,
}