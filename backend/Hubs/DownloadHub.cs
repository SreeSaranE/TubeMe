using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using YoutubeDownloader.Models;

namespace YoutubeDownloader.Hubs
{
    public class DownloadHub : Hub
    {
        public async Task JoinGroup(string groupName)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        }

        public async Task LeaveGroup(string groupName)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
        }
    }
}
