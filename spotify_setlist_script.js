window.onload = function() {
    let globalSongs = [];

    async function generateSetlist() {
        const playlistLink = document.getElementById('playlist-link').value;
        const targetTime = parseFloat(document.getElementById('target-time').value);

        if (!playlistLink || isNaN(targetTime)) {
            alert('Please enter both the Spotify playlist link and the target time.');
            return;
        }

        const playlistIdMatch = playlistLink.match(/playlist\/([a-zA-Z0-9]+)(\?.*)?$/);
        if (!playlistIdMatch) {
            alert('Please enter a valid Spotify playlist link.');
            return;
        }
        const playlistId = playlistIdMatch[1];

        try {
            let allTracks = [];
            let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

            while (nextUrl) {
                const response = await fetch(nextUrl, {
                    headers: {
                        'Authorization': 'Bearer BQBS_LHouZWzHycKEowaHMSjtnn6N9oTjxu11mQFX-2Ngl8qAxSGkySIVpLjET7194MhtuonYHJ5WJ0l_k4mSxiejRwpEbNb_FYjJKlyIDlV54GL8crsG_Mjy6CqhD7yvFp4IuxfENeg0Tehj5DUa81_hlzBLSegZA7NCn6CuyoyaeHytEuouTqOmaT7nErQQiD-N83Smx8Mg2Dw6Orr2MSnqW66FF4ZLOAq8key9M0TsXGLwVemzQsTZQXgpxWEjJReSKVx4ksp4Q' // Replace with a valid token
                    }
                });

                if (!response.ok) {
                    alert('Failed to fetch playlist. Please check the link or try again later.');
                    return;
                }

                const data = await response.json();

                if (data.items) {
                    allTracks = allTracks.concat(data.items);
                }

                nextUrl = data.next;
            }

            const songs = allTracks
                .filter(item => item.track)
                .map(item => {
                    const track = item.track;
                    return {
                        name: `${track.name} - ${track.artists.map(artist => artist.name).join(', ')}`,
                        duration: Math.ceil(track.duration_ms / 1000),
                        artistImage: track.album.images.length > 0 ? track.album.images[0].url : ''
                    };
                });

            if (songs.length === 0) {
                alert('No songs found in the playlist. Please ensure the playlist has tracks.');
                return;
            }

            globalSongs = [...songs];
            createSetlist(globalSongs, targetTime);
        } catch (error) {
            alert('An error occurred while generating the setlist. Please try again later.');
            console.error(error);
        }
    }

    function shuffleSongs(songs) {
        for (let i = songs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [songs[i], songs[j]] = [songs[j], songs[i]];
        }
    }

    function createSetlist(songs, targetTime) {
        shuffleSongs(songs);

        let setlist = [];
        let totalDuration = 0;
        const targetSeconds = targetTime * 3600;

        for (let song of songs) {
            if (totalDuration + song.duration > targetSeconds) {
                break;
            }
            setlist.push(song);
            totalDuration += song.duration;
        }

        const setlistBody = document.getElementById('setlist-body');
        setlistBody.innerHTML = '';
        setlist.forEach(song => {
            const row = document.createElement('tr');

            const artistImageCell = document.createElement('td');
            if (song.artistImage) {
                const img = document.createElement('img');
                img.src = song.artistImage;
                img.alt = 'Artist Image';
                img.width = 50;
                artistImageCell.appendChild(img);
            }
            row.appendChild(artistImageCell);

            const songNameCell = document.createElement('td');
            songNameCell.textContent = song.name;
            row.appendChild(songNameCell);

            const durationCell = document.createElement('td');
            durationCell.textContent = `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}`;
            row.appendChild(durationCell);

            setlistBody.appendChild(row);
        });

        document.getElementById('setlist-info').innerText = `Total Setlist Time: ${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`;
    }

    function downloadPDF() {
        const doc = new jsPDF();
        let yOffset = 20;

        // Add title to the PDF
        doc.setFontSize(16);
        doc.text("Generated Setlist:", 10, 10);

        // Add total setlist time
        const totalSetlistTime = document.getElementById('setlist-info').innerText;
        doc.setFontSize(12);
        doc.text(totalSetlistTime, 10, yOffset);
        yOffset += 10;

        // Add setlist songs in a table format
        const setlistBody = document.getElementById('setlist-body').children;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const cellWidth = 60; // Width for song name to prevent overlapping duration

        for (let row of setlistBody) {
            const songName = row.children[1].textContent;
            const duration = row.children[2].textContent;

            // Add the song name and duration
            doc.text(songName, 10, yOffset, { maxWidth: cellWidth }); // Ensure long names wrap to fit within the space
            doc.text(duration, 150, yOffset);
            yOffset += 10;
        }

        // Save the PDF
        doc.save('setlist.pdf');
    }

    document.getElementById('generate-button').addEventListener('click', async () => {
        await generateSetlist();
    });

    document.getElementById('shuffle-button').addEventListener('click', () => {
        if (globalSongs.length > 0) {
            shuffleSongs(globalSongs);
            createSetlist(globalSongs, parseFloat(document.getElementById('target-time').value));
        } else {
            alert('Please generate the setlist first before shuffling.');
        }
    });

    document.getElementById('download-button').addEventListener('click', downloadPDF);
};