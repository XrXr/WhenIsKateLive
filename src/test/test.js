describe('Totally redundant timezone conversion validations', function() {
    it('should covert to convert properly', function() {
        var converted = make_stream(new TimeSlot("Thursday", "11:00 PM", 2));
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
        describe('child', function() {
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
                it('is after start', function() {
                    expect(stream.end.isAfter(stream.start)).to.be.true;
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
                it('should exist', function() {
                    expect(stream).to.have.property("end_normalized");
                });
                it('is a number', function() {
                    expect(stream.end_normalized).to.be.a('number');
                });
            });
        });
        describe('.is_live()', function() {
            it('should return true', function() {
                expect(streams[0].is_live(streams[0].start_normalized)).to.be.true;
            });
            it('should return false', function() {
                expect(streams[0].is_live(streams[0].start_normalized - 1)).to.be.false;
            });
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

function internal_exported () {
    setup_streams_tests();
    mocha.run();
}