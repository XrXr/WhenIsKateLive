function TimeSlot (weekday, time, duration, canceled) {
    return {
        weekday: weekday,
        time: time,
        duration: duration,
        canceled: canceled
    };
}

describe('Totally redundant timezone conversion validations', function() {
    it('should convert correctly', function() {
        var converted = make_stream(TimeSlot("Thursday", "11:00 PM", 2, false));
        var delta = streamer_dst ? 7 * 60 - window.visitor_timezone_offset :
            8 * 60 - window.visitor_timezone_offset;
        var day = 4;
        if (delta / 60 + 23 > 24) {
            day = 5;
        }
        var time = (23 + delta / 60) % 24;
        expect(converted.start.isoWeekday()).to.equal(day);
        expect(converted.start.hours()).to.equal(time);
    });
});

function setup_streams_tests () {
    describe('streams', function() {
        it('should be an array', function() {
            expect(streams).to.be.a("Array");
        });
    });
    describe('find_next_stream()', function() {
        var FORMAT = 'E H';
        var fixture = [new Stream(moment('1 10', FORMAT), 2, true),
                       new Stream(moment('2 15', FORMAT), 4, false),
                       new Stream(moment('3 14', FORMAT), 3, true),
                       new Stream(moment('5 13', FORMAT), 3, true),
                       new Stream(moment('6 19', FORMAT), 2, false)];
        function since_week_start (moment_instance) {
            return moment_instance.unix() -
                moment_instance.clone().startOf('isoWeek').unix();
        }
        it('Should return next stream', function () {
            var subject = moment().startOf('isoWeek').add(14, 'h');
            var found = find_next_stream(fixture, since_week_start(subject));
            expect(fixture.indexOf(found)).to.equal(1);
        });
        it('Should return stream currently live', function () {
            var subject = moment().startOf('isoWeek').add(1, 'd').add(16, 'h');
            var found = find_next_stream(fixture, since_week_start(subject));
            expect(fixture.indexOf(found)).to.equal(1);
        });
        it('Should skip canceled streams', function () {
            var before = moment().startOf('isoWeek').add(2, 'd').add(11, 'h');
            var found = find_next_stream(fixture, since_week_start(before));
            expect(fixture.indexOf(found)).to.equal(4);
            var during = moment().startOf('isoWeek').add(4, 'd').add(15, 'h');
            found = find_next_stream(fixture, since_week_start(before));
            expect(fixture.indexOf(found)).to.equal(4);
        });
        it('Should wrap around to next week', function () {
            var subject = moment().startOf('isoWeek').add(6, 'd').add(22, 'h');
            var found = find_next_stream(fixture, since_week_start(subject));
            expect(found.start.isSame(fixture[1].start)).to.be.true;
            expect(found.end.isSame(fixture[1].end)).to.be.true;
            expect(found.duration).to.equal(fixture[1].duration);
            var one_week = 604800;
            expect(found.start_normalized).to.equal(fixture[1].start_normalized + one_week);
            expect(found.end_normalized).to.equal(fixture[1].end_normalized + one_week);
        });
    });
    describe('Stream object', function() {
        var stream = streams[0];
        describe('start property', function() {
            it('should exist', function() {
                expect(stream).to.have.property("start");
            });
            it('is a Moment object', function() {
                expect(moment.isMoment(stream.start)).to.be.true;
            });
        });
        describe('end property', function() {
            it('should exist', function() {
                expect(stream).to.have.property("end");
            });
            it('is a Moment object', function() {
                expect(moment.isMoment(stream.end)).to.be.true;
            });
        });
        describe('start_normalized property', function() {
            it('should exist', function() {
                expect(stream).to.have.property("start_normalized");
            });
            it('is a number', function() {
                expect(stream.start_normalized).to.be.a('number');
            });
        });
        describe('end_normalized property', function() {
            var start_time = moment().isoWeekday(7).hours(23).minutes(0).seconds(0);
            var stream = new Stream(start_time, 4, false);
            window.jojo = stream;

            it('should be normalized to the week when stream starts', function() {
                expect(stream.end_normalized).to.equal(moment.duration({
                    days: 6,
                    hours: 27
                }).asSeconds());
            });

            it('should have a difference same as the duration in seconds', function () {
                expect(stream.end_normalized - stream.start_normalized)
                    .to.equal(moment.duration(4, 'hours').asSeconds());
            })
        });
        describe('toString()', function() {
            it('returns special string for exactly noon', function () {
                var noon = moment().hours(12).minutes(0);
                var stream = new Stream(noon, 0, false);
                expect(stream.toString()).to.equal('Noon');
            });
            it('returns special string for midnight', function () {
                var midnight = moment().hours(0).minutes(0);
                var stream = new Stream(midnight, 0, false);
                expect(stream.toString()).to.equal('Beginning of day');
            });
        });
    });
    describe('.is_live()', function() {
        it('should return true', function() {
            var stream = new Stream(moment(), 2, false);
            expect(stream.is_live(stream.start_normalized)).to.be.true;
        });
        it('should return false', function() {
            var stream = new Stream(moment(), 2, false);
            expect(stream.is_live(stream.start_normalized - 1)).to.be.false;
        });
        it('is never live if there is no duration', function () {
            var zero_duration = new Stream(moment(), 0, false);
            var undefined_duration = new Stream(moment(), undefined, false);
            expect(zero_duration.is_live(zero_duration.start_normalized)).to.be.false;
            expect(undefined_duration.is_live(undefined_duration.start_normalized)).to.be.false;
        });
    });
}

describe('get_countdown()', function() {
    it('should return a string', function() {
      expect(get_countdown(1, 2)).to.be.a('string');
    });
    it('should throw an error when the two parameters are equal', function() {
        expect(get_countdown).to.throw(/called with invalid arguments/);
    });
    describe('Called with a, b,  a < b', function() {
        it('should return "1 day, 2 hours, 3 minutes"', function() {
            expect(get_countdown(0, 93780)).to.equal("1 day, 2 hours, 3 minutes");
        });
        it('should return "2 days, 1 hour, 3 minutes"', function() {
            expect(get_countdown(0, 176580)).to.equal("2 days, 1 hour, 3 minutes");
        });
        it('should return "2 days, 2 hours, 1 minute"', function() {
            expect(get_countdown(0, 180060)).to.equal("2 days, 2 hours, 1 minute");
        });
        it('should return "2 days, 2 minutes"', function() {
            expect(get_countdown(0, 172920)).to.equal("2 days, 2 minutes");
        });
    });
    describe('Called with a, b,  a > b', function() {
        it('should return "6 days, 23 hours, 43 minutes, 20 seconds"', function() {
            expect(get_countdown(2000, 1000)).to.equal("6 days, 23 hours, 43 minutes, 20 seconds");
        });
    });
});

setup_streams_tests();
