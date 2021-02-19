$(function () {

    const $btnProcess = $('#btnProcess');
    const $inputField = $('#input');

    const $meetingStart = $('#meetingStart');
    const $meetingEnd = $('#meetingEnd');
    const $timeOffset = $('#timeOffset');

    const $output = $('#output');

    $inputField.on('keyup',function (){
        $btnProcess.removeClass('disabled');
    });

    $meetingStart.change(function (){
        updateResults();
    });

    $meetingEnd.change(function (){
        updateResults();
    });

    $timeOffset.change(function (){
        updateResults();
    });

    $btnProcess.click(function () {
        updateResults();
    });

    function updateResults() {
        const result = process($inputField.val());
        $output.empty();
        for (let line of result){
            $output.append('<tr>' +
                '<td contenteditable="true">'+line[0]+'</td>' +
                '<td>'+line[1].format('HH:mm')+'</td>' +
                '<td>'+line[2].format('HH:mm')+'</td>' +
                '</tr>')
        }
        $('.total').text(result.length);
        $('#results').fadeIn();
    }

    function process(input) {
        const lines = input.split('\n');
        const rawRows  = [];// row example: ["Name Surname", "Joined", "26/01/2021, 10:56:56"]
        const people = new Set();
        for (let line of lines) {
            if (line.length > 1 && !line.includes('Full Name')) {
                const row = line.split(/\t/).map(c => c.trim());
                rawRows.push(row);
                people.add(row[0]);
            }
        }
        const meetingTimes = determineMeetingTimes(rawRows);
        $('.start').text($meetingStart.val());
        $('.end').text($meetingEnd.val());
        const offset = parseInt($timeOffset.val());
        const result = [];
        for (let person of people){
            const personData = rawRows.filter(r => r[0] === person).map(r => [r[1],moment(r[2], "DD/MM/YYYY, HH:mm:ss")]);

            const personJoins = personData.filter(r => r[0].includes('Joined')).map(j => j[1]);
            let joinTime = getTime(personJoins, meetingTimes, true);

            const personLeaves = personData.filter(r => r[0].includes('Left')).map(l => l[1]);
            let leaveTime = getTime(personLeaves, meetingTimes, false);

            result.push([person.replace(' (Convidado)','').replace(' (Guest)',''),
                joinTime.add(offset, 'h'), leaveTime.add(offset, 'h')]);
        }
        return result;
    }

    function determineMeetingTimes(rawRows) {
        const firstJoins = rawRows.map(r => r[2]).sort().slice(0, rawRows.length / 4);
        const day = firstJoins[0].slice(0,10);
        $('.day').text(day);

        if ($meetingStart.val() !== '' && $meetingEnd.val() !== ''){
            return [moment(day+', '+$meetingStart.val()+':00', "DD/MM/YYYY, HH:mm:ss"),
                moment(day+', '+$meetingEnd.val()+':00', "DD/MM/YYYY, HH:mm:ss")];

        } else {
            const hours = firstJoins.map(j => parseInt(j.slice(12,14)));
            const mostCommon = hours.sort((a,b) => hours.filter(v => v===a).length - hours.filter(v => v===b).length).pop();
            switch (mostCommon) {
                case 8:
                case 9:
                    $meetingStart.val('09:00');
                    $meetingEnd.val('11:00');
                    return [moment(day+', 09:00:00', "DD/MM/YYYY, HH:mm:ss"), moment(day+', 11:00:00', "DD/MM/YYYY, HH:mm:ss")];
                case 10:
                case 11:
                    $meetingStart.val('11:00');
                    $meetingEnd.val('13:00');
                    return [moment(day+', 11:00:00', "DD/MM/YYYY, HH:mm:ss"), moment(day+', 13:00:00', "DD/MM/YYYY, HH:mm:ss")];
                case 12:
                case 13:
                    $meetingStart.val('13:00');
                    $meetingEnd.val('15:00');
                    return [moment(day+', 13:00:00', "DD/MM/YYYY, HH:mm:ss"), moment(day+', 15:00:00', "DD/MM/YYYY, HH:mm:ss")];
                case 15:
                case 16:
                default:
                    $meetingStart.val('16:00');
                    $meetingEnd.val('18:00');
                    return [moment(day+', 16:00:00', "DD/MM/YYYY, HH:mm:ss"), moment(day+', 18:00:00', "DD/MM/YYYY, HH:mm:ss")];
            }
        }
    }

    function getTime(personRecords, meetingTimes, isMin) {
        if (personRecords.length < 1) {
            if (isMin){
                return meetingTimes[0].clone();
            } else {
                return meetingTimes[1].clone();
            }
        } else if (personRecords.length === 1) {
            return personRecords[0];
        } else {
            if (isMin){
                return moment.min(personRecords);
            } else {
                return moment.max(personRecords);
            }
        }
    }

});

