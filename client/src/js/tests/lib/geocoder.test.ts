import { geocode } from '../../lib/geocoder';

class MockGeocoder {
    geocode(searchQuery, callback) {

        if (searchQuery.address == "XXX") {
            callback([], 403);
        }
        else {
            callback([{
                formatted_address : "Edinburgh, UK",
                geometry : {
                    location : {
                        lat: () => 55.953056,
                        lng: () => -3.188889
                    }
                }
            }], 200);
        }
    }
}

test('geocode() fails if Google not loaded', async () => {

    expect(geocode("Edinburgh")).rejects.toEqual("Google Maps not loaded");

});

test('geocode() works on a normal request', async () => {

    global.google = {
        maps : {
            Geocoder: MockGeocoder,
            GeocoderStatus : { OK : 200 }
        }
    }
    let result = await geocode("Edinburgh");
    expect(result[0].name).toEqual("Edinburgh, UK")
    expect(result[0].gridReference).toEqual("NT2577173970")

});


test('geocode() copes with a bad request', async () => {

    expect(geocode("XXX")).rejects.toEqual(403);

});
