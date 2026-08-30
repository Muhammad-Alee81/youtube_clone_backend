

01. Get All Videos (supports pagination) (for loggedIn user as well as Guest user)
http://localhost:4000/api/v1/videos/all?


--------------------------------------------------------------------------
02. SUBSCRIPTION APIS
---------------------------------------------------------------------

Get All Subscriptions (supports pagination) (for authenticated user)
01. http://localhost:4000/api/v1/subscriptions/my

--------------------------------------------------------------------------


----------------------------------------
03. Users Watch History Apis 
---------------------------------------

Get users watch history(supports pagination)
01. (GET) /watch-history/

Delete Video from watch History
02. (DELETE) /watch-history/:videoId

Clear all History 
03. (DELETE) /watch-history/clear-history

 Add video to Watch History
 04. (POST) /watch-history/:videoId

 ----------------------------------------------------------------------


----------------------------------------------------------------
04. PLAYLIST APIS (authentication required)
---------------------------------------------------------------

create playlist
01. (POST)  /playlists/ (authenticated user only)

get users playlists
02. (GET) /users/:userId/playlists

add video to playlist
03. (PATCH) /playlists/add/:videoId/:playlistId

remove video from playlist
04. /remove/:videoId/:playlistId

update Playlist 
05. /playlists/:playlistId

delete playlist
06. (DELETE)/playlists/:playlistId

get playlist by id
07. (GET) /playlists/:id